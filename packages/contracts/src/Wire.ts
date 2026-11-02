import { z } from 'zod'

export const InstantSchema = z.iso.datetime()

export const DurationSecondsSchema = z.number().int().nonnegative()

export const QuantitySchema = z.number().nonnegative()

export const WholeCountSchema = z.number().int().nonnegative()

export const BuildingLevelSchema = z.number().int().positive()

export const CampTierSchema = z.enum({ one: 1, two: 2, three: 3 })
