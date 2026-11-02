import { createRoute } from '@hono/zod-openapi'
import {
  CancelRecruitOrderRequestSchema,
  CancelStudyRequestSchema,
  CancelUpgradeRequestSchema,
  DispatchAttackRequestSchema,
  DispatchFoundingRequestSchema,
  DispatchMarchRequestSchema,
  DispatchTransportRequestSchema,
  EnqueueBuildingRequestSchema,
  FiefChronicleSchema,
  FiefOverviewSchema,
  FiefRequestSchema,
  PlaceRecruitOrderRequestSchema,
  RecallMarchRequestSchema,
  StartStudyRequestSchema,
} from '@mygame/contracts'
import { type ResponseDeclaration, refusalResponse } from '../http/refusalResponse'
import { jsonBody, jsonResponse, signedOutResponse } from '../http/responseDeclarations'

const FiefOverviewComponent = FiefOverviewSchema.meta({ id: 'FiefOverview' })

const FiefChronicleComponent = FiefChronicleSchema.meta({ id: 'FiefChronicle' })

const malformedRequestResponse: ResponseDeclaration = {
  description: 'A malformed fief id, path or body. Empty body.',
}

const fiefNotFoundResponse = refusalResponse('FiefNotFound, for an unknown fief or another lord’s.')

const onFief = (
  responses: Readonly<Record<number, ResponseDeclaration>>,
): Readonly<Record<number, ResponseDeclaration>> => ({
  400: malformedRequestResponse,
  401: signedOutResponse,
  404: fiefNotFoundResponse,
  ...responses,
})

const overviewResponse = (description: string): ResponseDeclaration =>
  jsonResponse(description, FiefOverviewComponent)

const mutationResponses = (
  success: string,
  refusals: Readonly<Record<number, ResponseDeclaration>>,
): Readonly<Record<number, ResponseDeclaration>> =>
  onFief({ 200: overviewResponse(success), ...refusals })

const marchRefusals =
  'MarchSlotBusy, NotEnoughUnitsAtHome, UnitUnfitForOrder, StayOutOfRange, MarchTargetOutOfBounds, MarchToOwnPlot, PlotHeld and PlotReserved'

export const fiefDeclarations = {
  overview: createRoute({
    method: 'get',
    path: '/',
    request: { params: FiefRequestSchema },
    responses: onFief({
      200: overviewResponse(
        'The fief the path names, accrued to the read; the session is renewed.',
      ),
    }),
  }),
  events: createRoute({
    method: 'get',
    path: '/events',
    request: { params: FiefRequestSchema },
    responses: onFief({
      200: jsonResponse(
        'The fief’s chronicle, newest first, after the finishes no read had applied yet.',
        FiefChronicleComponent,
      ),
    }),
  }),
  enqueueUpgrade: createRoute({
    method: 'post',
    path: '/upgrades',
    request: {
      params: FiefRequestSchema,
      body: jsonBody(EnqueueBuildingRequestSchema.meta({ id: 'EnqueueBuildingRequest' })),
    },
    responses: mutationResponses('The fief with the upgrade started or queued.', {
      400: refusalResponse('UnknownBuilding; a malformed fief id or body answers an empty body.'),
      409: refusalResponse(
        'MaxLevelReached, QueueFull, InsufficientResources or NotEnoughPeasants.',
      ),
    }),
  }),
  cancelUpgrade: createRoute({
    method: 'delete',
    path: '/upgrades/{building}/{targetLevel}',
    request: { params: FiefRequestSchema.extend(CancelUpgradeRequestSchema.shape) },
    responses: mutationResponses('The fief with the upgrade cancelled and its cost refunded.', {
      409: refusalResponse('UpgradeNotFound.'),
    }),
  }),
  startStudy: createRoute({
    method: 'post',
    path: '/studies',
    request: {
      params: FiefRequestSchema,
      body: jsonBody(StartStudyRequestSchema.meta({ id: 'StartStudyRequest' })),
    },
    responses: mutationResponses('The fief with the study started.', {
      409: refusalResponse(
        'StudySlotBusy, LibraryLevelTooLow, ArtMaxLevelReached or InsufficientResources.',
      ),
    }),
  }),
  cancelStudy: createRoute({
    method: 'delete',
    path: '/studies/{art}/{targetLevel}',
    request: { params: FiefRequestSchema.extend(CancelStudyRequestSchema.shape) },
    responses: mutationResponses('The fief with the study cancelled and its cost refunded.', {
      409: refusalResponse('StudyNotFound.'),
    }),
  }),
  placeRecruitOrder: createRoute({
    method: 'post',
    path: '/recruit-orders',
    request: {
      params: FiefRequestSchema,
      body: jsonBody(PlaceRecruitOrderRequestSchema.meta({ id: 'PlaceRecruitOrderRequest' })),
    },
    responses: mutationResponses('The fief with the recruit order placed.', {
      409: refusalResponse(
        'BarracksNotBuilt, BarracksTooLow, RecruitSlotBusy, InsufficientResources or NotEnoughPeasants.',
      ),
    }),
  }),
  cancelRecruitOrder: createRoute({
    method: 'delete',
    path: '/recruit-orders/{unit}/{startedAt}',
    request: { params: FiefRequestSchema.extend(CancelRecruitOrderRequestSchema.shape) },
    responses: mutationResponses('The fief with the recruit order cancelled and refunded.', {
      409: refusalResponse('RecruitOrderNotFound.'),
    }),
  }),
  dispatchMarch: createRoute({
    method: 'post',
    path: '/marches',
    request: {
      params: FiefRequestSchema,
      body: jsonBody(DispatchMarchRequestSchema.meta({ id: 'DispatchMarchRequest' })),
    },
    responses: mutationResponses('The fief with the forage march away.', {
      409: refusalResponse(`PlotHasCamp, ${marchRefusals}.`),
    }),
  }),
  dispatchAttack: createRoute({
    method: 'post',
    path: '/marches/attack',
    request: {
      params: FiefRequestSchema,
      body: jsonBody(DispatchAttackRequestSchema.meta({ id: 'DispatchAttackRequest' })),
    },
    responses: mutationResponses('The fief with the attack march away.', {
      409: refusalResponse(`PlotHasNoCamp, ${marchRefusals}.`),
    }),
  }),
  dispatchFounding: createRoute({
    method: 'post',
    path: '/marches/found',
    request: {
      params: FiefRequestSchema,
      body: jsonBody(DispatchFoundingRequestSchema.meta({ id: 'DispatchFoundingRequest' })),
    },
    responses: mutationResponses('The fief with the settler away to found a fief.', {
      400: refusalResponse('BlankFiefName; a malformed fief id or body answers an empty body.'),
      409: refusalResponse(`FiefCapReached, PlotHasCamp, ${marchRefusals}.`),
    }),
  }),
  dispatchTransport: createRoute({
    method: 'post',
    path: '/marches/transport',
    request: {
      params: FiefRequestSchema,
      body: jsonBody(DispatchTransportRequestSchema.meta({ id: 'DispatchTransportRequest' })),
    },
    responses: mutationResponses('The fief with the transport away.', {
      404: refusalResponse(
        'FiefNotFound, for an unknown fief, another lord’s, or a destination the lord does not hold.',
      ),
      409: refusalResponse(`EmptyCargo, CargoAboveCarry, InsufficientResources, ${marchRefusals}.`),
    }),
  }),
  recallMarch: createRoute({
    method: 'post',
    path: '/marches/{departedAt}/recall',
    request: { params: FiefRequestSchema.extend(RecallMarchRequestSchema.shape) },
    responses: mutationResponses('The fief with the march turned back.', {
      409: refusalResponse('MarchNotFound or MarchAlreadyReturning.'),
    }),
  }),
  dismissGuidance: createRoute({
    method: 'post',
    path: '/guidance/dismissal',
    request: { params: FiefRequestSchema },
    responses: onFief({ 204: { description: 'The fief’s guidance is dismissed.' } }),
  }),
}
