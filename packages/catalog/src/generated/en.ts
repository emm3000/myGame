export const authEmail = (): string => `Email`
export const authPassword = (): string => `Password`
export const authSignInForgotPassword = (): string => `Forgot your password?`
export const authSignInSubmit = (): string => `Sign in`
export const authSignInSwitchLink = (): string => `Create your account`
export const authSignInSwitchPrompt = (): string => `No account yet?`
export const authSignInTitle = (): string => `Sign in to your town`
export const authSignUpPasswordHint = (): string => `At least 8 characters.`
export const authSignUpSubmit = (): string => `Create account`
export const authSignUpSwitchLink = (): string => `Sign in`
export const authSignUpSwitchPrompt = (): string => `Already have an account?`
export const authSignUpTitle = (): string => `Create your account`
export const authTagline = (): string => `Learn English while your town grows.`
export const mailResetSubject = (): string => `Change your password`
export const mailResetText = ({ link }: { readonly link: string | number }): string => `Someone asked to change your Townword password. If it was you, open this link and choose a new one:\n\n${String(link)}\n\nThe link works for one hour and only once.\n\nIf you did not ask for this, ignore this email: your password stays the same.`
export const mailVerificationSubject = (): string => `Confirm your email`
export const mailVerificationText = ({ link }: { readonly link: string | number }): string => `Open this link to confirm this email for your town:\n\n${String(link)}\n\nThe link works for 24 hours and only once. If it expires, ask for another one from your town.\n\nIf you have not started a town, ignore this email.`
export const mapArea = ({ area }: { readonly area: string | number }): string => `Area ${String(area)}`
export const mapBackToOwnArea = (): string => `Back to your area`
export const mapCleanUpAction = (): string => `Clean the waste`
export const mapCleanUpActionTo = ({ site }: { readonly site: string | number }): string => `Clean the waste at site ${String(site)}`
export const mapCleanUpShort = (): string => `Your team cannot clean all this waste. Send more workers or trucks.`
export const mapCleanUpTeam = ({ strength }: { readonly strength: string | number }): string => `Your team: ${String(strength)}`
export const mapCleanUpTitle = ({ site }: { readonly site: string | number }): string => `Cleaning at site ${String(site)}`
export const mapCleanUpOutTitle = (): string => `Cleaning the waste`
export const mapFree = (): string => `Free`
export const mapJobAtHome = ({ count }: { readonly count: string | number }): string => `${String(count)} at home`
export const mapJobCountNeeded = (): string => `Send 0, 1, 2 or more.`
export const mapJobHours = (): string => `Hours of work`
export const mapJobHoursNeeded = (): string => `Work for 1 hour or more.`
export const mapJobPay = ({ amounts }: { readonly amounts: string | number }): string => `This job pays ${String(amounts)}`
export const mapJobSend = (): string => `Send the team`
export const mapJobTitle = ({ site }: { readonly site: string | number }): string => `Job at site ${String(site)}`
export const mapJobTrucks = (): string => `Trucks to send`
export const mapJobWorkers = (): string => `Workers to send`
export const mapJobOutCallBack = (): string => `Call the team back`
export const mapJobOutCalledBack = (): string => `Called back, coming back`
export const mapJobOutOutbound = (): string => `On the way`
export const mapJobOutPay = ({ amounts }: { readonly amounts: string | number }): string => `Pay: ${String(amounts)}`
export const mapJobOutReturning = (): string => `Coming back`
export const mapJobOutSite = ({ area, region, site }: { readonly area: string | number; readonly region: string | number; readonly site: string | number }): string => `Region ${String(region)}, area ${String(area)}, site ${String(site)}`
export const mapJobOutTeam = ({ trucks, workers }: { readonly trucks: number; readonly workers: number }): string => `Your team: ${workers === 1 ? `1 worker` : `${String(workers)} workers`}, ${trucks === 1 ? `1 truck` : `${String(trucks)} trucks`}`
export const mapJobOutTitle = (): string => `Job`
export const mapJobOutWorking = (): string => `Working`
export const mapLoading = (): string => `Reading the map…`
export const mapNext = (): string => `Next area`
export const mapOwnTown = (): string => `Your town`
export const mapPrevious = (): string => `Previous area`
export const mapRowLine = (): string => `Send a team on a job.`
export const mapRowLink = (): string => `Go to the map`
export const mapSendTeam = (): string => `Send a team`
export const mapSendTeamTo = ({ site }: { readonly site: string | number }): string => `Send a team to site ${String(site)}`
export const mapSite = ({ site }: { readonly site: string | number }): string => `Site ${String(site)}`
export const mapTitle = (): string => `Map`
export const mapWasteAmount = ({ waste }: { readonly waste: string | number }): string => `Waste: ${String(waste)}`
export const mapWasteSize = ({ size }: { readonly size: string | number }): string => `Waste site, size ${String(size)}`
export const namesHiresTruck = (): string => `Trucks`
export const namesHiresWorker = (): string => `Workers`
export const namesPlacesFactory = (): string => `Factory`
export const namesPlacesFarm = (): string => `Farm`
export const namesPlacesHomes = (): string => `Homes`
export const namesPlacesOffice = (): string => `Office`
export const namesPlacesPowerStation = (): string => `Power station`
export const namesPlacesSchool = (): string => `School`
export const namesPlacesStorage = (): string => `Storage`
export const namesSeasonsFall = (): string => `fall`
export const namesSeasonsSpring = (): string => `spring`
export const namesSeasonsSummer = (): string => `summer`
export const namesSeasonsWinter = (): string => `winter`
export const namesTerrainsFields = (): string => `Fields`
export const namesTerrainsHills = (): string => `Hills`
export const namesTerrainsRiver = (): string => `River`
export const namesTownResourcesFood = (): string => `food`
export const namesTownResourcesMaterial = (): string => `material`
export const namesTownResourcesMoney = (): string => `money`
export const namesTownResourcesPower = (): string => `power`
export const newsLoading = (): string => `Reading the news…`
export const newsNone = (): string => `No news.`
export const newsTitle = (): string => `Town News`
export const passwordResetNewPasswordChanged = (): string => `Your password has changed and we have closed all your sessions.`
export const passwordResetNewPasswordNewLink = (): string => `Ask for another link`
export const passwordResetNewPasswordPassword = (): string => `New password`
export const passwordResetNewPasswordPasswordHint = (): string => `At least 8 characters.`
export const passwordResetNewPasswordSubmit = (): string => `Change password`
export const passwordResetNewPasswordTitle = (): string => `Choose a new password`
export const passwordResetRequestConfirmation = (): string => `If that email has a confirmed account, a link that works for one hour is on its way.`
export const passwordResetRequestSubmit = (): string => `Send link`
export const passwordResetRequestTitle = (): string => `Reset your password`
export const refusalAreaNotFound = (): string => `That area is past the end of the map.`
export const refusalBlankTownName = (): string => `Write a name for your town.`
export const refusalBuildingWorkNotFound = ({ level }: { readonly level: string | number }): string => `The work for level ${String(level)} is no longer on the list. It may have finished.`
export const refusalEmailTaken = (): string => `There is already an account with that email. Sign in with it or use another email.`
export const refusalHintOnRecognition = (): string => `You choose this word from a list, so it has no hint. The hint comes when you have to write it.`
export const refusalHiringOrderNotFound = (): string => `This hiring has already ended.`
export const refusalHiringSlotBusy = (): string => `You are already hiring. Wait for that hiring to end.`
export const refusalInvalidCredentials = (): string => `The email or the password is not correct.`
export const refusalInvalidTeam = (): string => `Choose at least one worker or truck for the team.`
export const refusalJobAlreadyReturning = (): string => `Your team is already on its way back.`
export const refusalJobHoursOutOfRange = ({ maxHours }: { readonly maxHours: string | number }): string => `A job lasts from 1 to ${String(maxHours)} hours.`
export const refusalJobNotFound = (): string => `This job has already ended.`
export const refusalJobSiteOutOfBounds = (): string => `That site is not on the map.`
export const refusalJobToOwnSite = (): string => `That site is your town. Choose another site.`
export const refusalLearningCapReached = ({ cardsInLearning, learningCap }: { readonly cardsInLearning: string | number; readonly learningCap: string | number }): string => `Words in learning: ${String(cardsInLearning)} of ${String(learningCap)}. Review them before you start another lesson.`
export const refusalLessonAlreadyStudied = (): string => `You already studied that lesson: its words are in your reviews.`
export const refusalLessonSchoolTooLow = (): string => `That lesson needs a school of a higher level. Build it to a higher level first.`
export const refusalLessonStudyNotFound = (): string => `The school is no longer studying that lesson. There is nothing to stop.`
export const refusalLessonUnderStudy = (): string => `The school is already studying that lesson. Wait for it to finish.`
export const refusalMailNotSent = (): string => `We could not send it.`
export const refusalMalformedEmail = (): string => `Enter a valid email, like name@example.com.`
export const refusalNoWasteYet = (): string => `That site is clean for now. Come back later.`
export const refusalNotAWasteSite = (): string => `That site has no waste. Choose a waste site.`
export const refusalNotEnoughHiresAtHome = ({ atHome, count, hire }: { readonly atHome: string | number; readonly count: number; readonly hire: 'worker' | 'truck' }): string => `${hire === 'worker' ? `${count === 1 ? `The team needs 1 worker` : `The team needs ${String(count)} workers`} and you have ${String(atHome)} at home.` : hire === 'truck' ? `${count === 1 ? `The team needs 1 truck` : `The team needs ${String(count)} trucks`} and you have ${String(atHome)} at home.` : `${count === 1 ? `The team needs 1 truck` : `The team needs ${String(count)} trucks`} and you have ${String(atHome)} at home.`}`
export const refusalNotEnoughPeople = ({ freePeople, requiredPeople }: { readonly freePeople: string | number; readonly requiredPeople: number }): string => `This work needs ${requiredPeople === 1 ? `1 free person` : `${String(requiredPeople)} free people`} and you have ${String(freePeople)}. Build your homes to a higher level.`
export const refusalNotEnoughResources = (): string => `You do not have enough for this work. Wait until your town makes more.`
export const refusalOfficeTooLow = ({ officeLevel, requiredOfficeLevel }: { readonly officeLevel: string | number; readonly requiredOfficeLevel: string | number }): string => `Your office is at level ${String(officeLevel)}. This hire needs level ${String(requiredOfficeLevel)}.`
export const refusalPlayerAlreadyHoldsTown = (): string => `You already have a town. You can have only one.`
export const refusalReviewNotDue = (): string => `That word is not due yet. Go back to your reviews to see the ones that are.`
export const refusalSiteHeld = (): string => `Another town is on that site. Choose a free site.`
export const refusalStudySlotBusy = (): string => `The school is already studying a lesson. Wait for it to finish.`
export const refusalTeamAlreadyOut = (): string => `Your team is already out. Wait for it to come back.`
export const refusalTokenInvalid = (): string => `That link does not work: it has expired, it was already used or it was never sent. Ask for another one.`
export const refusalTopLevelReached = ({ level }: { readonly level: string | number }): string => `This building is already at its top level, ${String(level)}.`
export const refusalTownNotFound = (): string => `You have no town yet. Name it to start it.`
export const refusalUnexpected = (): string => `We could not reach the server. Try again in a moment.`
export const refusalUnknownChoice = (): string => `That choice is no longer on the card. Go back to your reviews to see it again.`
export const refusalUnknownWord = (): string => `That word is not in your lessons. Go back to your reviews.`
export const refusalWaitingListFull = ({ cap }: { readonly cap: number }): string => `${cap === 1 ? `The waiting list already holds 1 work.` : `The waiting list already holds ${String(cap)} works.`} Wait for one to finish.`
export const refusalWeakPassword = (): string => `Your password needs at least 8 characters.`
export const refusalWordNotHeld = (): string => `That word is not in your lessons. Go back to your reviews.`
export const refusalHiringNotEnoughPeople = ({ freePeople, requiredPeople }: { readonly freePeople: string | number; readonly requiredPeople: string | number }): string => `This hire needs ${String(requiredPeople)} of your free people and you have ${String(freePeople)}. Build the next level of your homes.`
export const refusalHiringNotEnoughResources = (): string => `You do not have what you need to pay for this hire. Wait and try again.`
export const reportLoading = (): string => `Reading your Report…`
export const reportNewsAll = (): string => `Read all the news`
export const reportNewsBecameCity = (): string => `Your town is now a city.`
export const reportNewsBuildingWorkFinished = ({ level, place }: { readonly level: string | number; readonly place: string | number }): string => `${String(place)}: now level ${String(level)}.`
export const reportNewsBuildingWorkStopped = ({ level, place }: { readonly level: string | number; readonly place: string | number }): string => `You stopped the work: ${String(place)}, level ${String(level)}.`
export const reportNewsCleanUpDone = ({ area, region, site }: { readonly area: string | number; readonly region: string | number; readonly site: string | number }): string => `Your team cleaned the waste at region ${String(region)}, area ${String(area)}, site ${String(site)}.`
export const reportNewsCleanUpFailed = ({ area, region, site }: { readonly area: string | number; readonly region: string | number; readonly site: string | number }): string => `Your team could not clean the waste at region ${String(region)}, area ${String(area)}, site ${String(site)}.`
export const reportNewsClose = (): string => `Close the news`
export const reportNewsClosed = (): string => `You closed the news.`
export const reportNewsHiringDeliveredTruck = ({ count }: { readonly count: number }): string => `${count === 1 ? `You hired 1 truck.` : `You hired ${String(count)} trucks.`}`
export const reportNewsHiringDeliveredWorker = ({ count }: { readonly count: number }): string => `${count === 1 ? `You hired 1 worker.` : `You hired ${String(count)} workers.`}`
export const reportNewsHiringStoppedTruck = ({ count, delivered }: { readonly count: string | number; readonly delivered: string | number }): string => `You stopped hiring trucks: ${String(delivered)} of ${String(count)} came.`
export const reportNewsHiringStoppedWorker = ({ count, delivered }: { readonly count: string | number; readonly delivered: string | number }): string => `You stopped hiring workers: ${String(delivered)} of ${String(count)} came.`
export const reportNewsJobBack = ({ area, region, site }: { readonly area: string | number; readonly region: string | number; readonly site: string | number }): string => `Your team came back from region ${String(region)}, area ${String(area)}, site ${String(site)}.`
export const reportNewsJobCalledBack = ({ area, region, site }: { readonly area: string | number; readonly region: string | number; readonly site: string | number }): string => `You called your team back from region ${String(region)}, area ${String(area)}, site ${String(site)}.`
export const reportNewsLessonStopped = (): string => `You stopped studying a lesson.`
export const reportNewsLessonStudied = (): string => `You studied a lesson.`
export const reportNewsNone = (): string => `No news.`
export const reportNewsPay = ({ amounts }: { readonly amounts: string | number }): string => `Pay: ${String(amounts)}`
export const reportNewsRefund = ({ amounts }: { readonly amounts: string | number }): string => `Back to you: ${String(amounts)}`
export const reportNewsSkillEarned = ({ percent, resource }: { readonly percent: string | number; readonly resource: string | number }): string => `You earned a ${String(resource)} skill: +${String(percent)} % ${String(resource)}.`
export const reportNewsTitle = (): string => `Town News`
export const reportNoReviewsDue = (): string => `No reviews due now.`
export const reportReviewsDue = ({ count }: { readonly count: string | number }): string => `Reviews due: ${String(count)}`
export const reportStartReviews = (): string => `Start the reviews`
export const reportTitle = (): string => `Report`
export const reviewAnswerField = (): string => `Your answer in English`
export const reviewAskHint = (): string => `Ask for a hint`
export const reviewBackToTown = (): string => `Back to your town`
export const reviewCheck = (): string => `Check`
export const reviewChecking = (): string => `Checking…`
export const reviewComesBack = (): string => `This word will come back in a few minutes.`
export const reviewCorrect = (): string => `Correct.`
export const reviewDueCount = ({ count }: { readonly count: string | number }): string => `Reviews due: ${String(count)}`
export const reviewFailed = (): string => `We could not read your reviews.`
export const reviewHint = ({ firstLetter, letterCount }: { readonly firstLetter: string | number; readonly letterCount: number }): string => `It starts with “${String(firstLetter)}” and has ${letterCount === 1 ? `${String(letterCount)} letter` : `${String(letterCount)} letters`}.`
export const reviewLessonReady = ({ number }: { readonly number: string | number }): string => `Lesson ${String(number)} is ready`
export const reviewLoading = (): string => `Reading your reviews…`
export const reviewNearMiss = (): string => `Almost. Check the spelling and try again.`
export const reviewNext = (): string => `Next`
export const reviewNextReview = (): string => `Next review:`
export const reviewNoCards = (): string => `You have no words to review.`
export const reviewNothingDue = (): string => `No reviews due now.`
export const reviewRecallPrompt = (): string => `How do you say it in English?`
export const reviewRecognitionPrompt = (): string => `What does it mean?`
export const reviewRetry = (): string => `Try again`
export const reviewRightAnswer = (): string => `The right answer:`
export const reviewSkillEarned = ({ level, resource }: { readonly level: string | number; readonly resource: string | number }): string => `Skill earned: ${String(resource)}, level ${String(level)}.`
export const reviewSkillRate = ({ percent, resource }: { readonly percent: string | number; readonly resource: string | number }): string => `+${String(percent)} % ${String(resource)} / h.`
export const reviewSkillRates = ({ after, before, resource }: { readonly after: string | number; readonly before: string | number; readonly resource: string | number }): string => `${String(resource)}: +${String(before)} / h, now +${String(after)} / h`
export const reviewSkillWords = (): string => `Words:`
export const reviewTitle = (): string => `Reviews`
export const reviewWrong = (): string => `That is not correct.`
export const reviewYourAnswer = (): string => `Your answer:`
export const schoolLearning = ({ cap, inLearning }: { readonly cap: string | number; readonly inLearning: string | number }): string => `Words in learning: ${String(inLearning)} of ${String(cap)}`
export const schoolLearningFull = ({ count }: { readonly count: number }): string => `${count === 1 ? `The next lesson needs 1 word.` : `The next lesson needs ${String(count)} words.`} Start the reviews.`
export const schoolLessonCapReached = ({ cap, count, inLearning }: { readonly cap: string | number; readonly count: string | number; readonly inLearning: string | number }): string => `Words in learning: ${String(inLearning)} of ${String(cap)}. This lesson needs ${String(count)}.`
export const schoolLessonNeedsSchool = ({ level }: { readonly level: string | number }): string => `Needs school level ${String(level)}`
export const schoolLessonNext = (): string => `Next lesson`
export const schoolLessonNothingToRead = (): string => `No words to read now.`
export const schoolLessonReadWords = (): string => `Read the words`
export const schoolLessonReward = ({ percent, resource }: { readonly percent: string | number; readonly resource: string | number }): string => `${String(resource)} skill: +${String(percent)} %`
export const schoolLessonSlotBusy = ({ number }: { readonly number: string | number }): string => `The school is studying lesson ${String(number)}.`
export const schoolLessonStudied = (): string => `Studied`
export const schoolLessonStudy = ({ number }: { readonly number: string | number }): string => `Study lesson ${String(number)}`
export const schoolLessonStudying = (): string => `Studying`
export const schoolLessonTitle = ({ number }: { readonly number: string | number }): string => `Lesson ${String(number)}`
export const schoolLessonWordNext = (): string => `Next word`
export const schoolLessonWordPosition = ({ count, number }: { readonly count: string | number; readonly number: string | number }): string => `Word ${String(number)} of ${String(count)}`
export const schoolLessonWordThen = (): string => `When the lesson ends, the reviews start.`
export const schoolLessonWords = ({ count }: { readonly count: number }): string => `${count === 1 ? `1 word` : `${String(count)} words`}`
export const schoolLessons = (): string => `Lessons`
export const schoolPathCount = ({ count, total }: { readonly count: string | number; readonly total: string | number }): string => `${String(count)} of ${String(total)}`
export const schoolPathLearned = (): string => `Learned`
export const schoolPathRead = (): string => `Read`
export const schoolPathReviewed = (): string => `Reviewed`
export const schoolPathStudied = (): string => `Studied`
export const schoolSkillName = ({ level, resource }: { readonly level: string | number; readonly resource: string | number }): string => `Level ${String(level)} ${String(resource)} skill`
export const schoolSkillRate = ({ percent, resource }: { readonly percent: string | number; readonly resource: string | number }): string => `+${String(percent)} % ${String(resource)}`
export const schoolSkills = (): string => `Your skills`
export const schoolSkillsNone = (): string => `You have no skills.`
export const schoolSlotDone = (): string => `The lesson is done. Reading your town again…`
export const schoolSlotIdle = (): string => `No lesson now.`
export const schoolSlotRefund = (): string => `Stop it and you can study it again.`
export const schoolSlotStop = (): string => `Stop studying`
export const schoolSlotStopOf = ({ number }: { readonly number: string | number }): string => `Stop studying lesson ${String(number)}`
export const schoolSlotTitle = (): string => `Studying`
export const shellLessonFinishClose = (): string => `Close`
export const shellLessonFinishLine = ({ number }: { readonly number: string | number }): string => `Lesson ${String(number)} is done.`
export const shellNavigationReport = (): string => `Report`
export const shellNavigationTown = (): string => `Town`
export const shellRetainedWords = ({ count, total }: { readonly count: string | number; readonly total: number }): string => `${String(count)} of ${total === 1 ? `1 word` : `${String(total)} words`} learned`
export const shellSignOut = (): string => `Sign out`
export const shellTitle = (): string => `Townword`
export const statusTomorrow = ({ time }: { readonly time: string | number }): string => `tomorrow ${String(time)}`
export const timeToday = ({ time }: { readonly time: string | number }): string => `Today, ${String(time)}`
export const townAmount = ({ amount, resource }: { readonly amount: string | number; readonly resource: string | number }): string => `${String(amount)} ${String(resource)}`
export const townAtTopLevel = (): string => `It is at the top level.`
export const townBuild = ({ level }: { readonly level: string | number }): string => `Build level ${String(level)}`
export const townCostName = ({ resource }: { readonly resource: string | number }): string => `${String(resource)}`
export const townFull = ({ capacity }: { readonly capacity: string | number }): string => `Full: ${String(capacity)}`
export const townGoToSchool = (): string => `Go to the school`
export const townGoalClose = (): string => `Close the goal`
export const townGoalLine = ({ count, level, place, position }: { readonly count: string | number; readonly level: string | number; readonly place: string | number; readonly position: string | number }): string => `Goal ${String(position)} of ${String(count)}: ${String(place)}, level ${String(level)}`
export const townGoalPeople = ({ count }: { readonly count: string | number }): string => `Free people needed: ${String(count)}.`
export const townGoalReady = (): string => `You have what it needs.`
export const townInWork = (): string => `In work`
export const townLabelCity = (): string => `City`
export const townLabelTown = (): string => `Town`
export const townLevel = ({ level }: { readonly level: string | number }): string => `Level ${String(level)}`
export const townLoading = (): string => `Reading your town…`
export const townNamingField = (): string => `Town name`
export const townNamingGoToTown = (): string => `Go to your town`
export const townNamingMayor = (): string => `You are the mayor.`
export const townNamingSubmit = (): string => `Start`
export const townNamingTitle = (): string => `Name your town`
export const townNextBuildFactory = (): string => `Build the factory`
export const townNextBuildFarm = (): string => `Build the farm`
export const townNextBuildPowerStation = (): string => `Build the power station`
export const townNextGoToReport = (): string => `Go to the Report`
export const townNextHoldoutCheck = ({ band }: { readonly band: string | number }): string => `Word check for band ${String(band)}`
export const townNextLessonReadyIn = ({ number }: { readonly number: string | number }): string => `Lesson ${String(number)} ready in`
export const townNextReleasedLesson = ({ band, number }: { readonly band: string | number; readonly number: string | number }): string => `Returning words: band ${String(band)}, set ${String(number)}`
export const townNextTitle = (): string => `What is next`
export const townNotBuilt = (): string => `Not built`
export const townOfficeBusy = (): string => `Wait for this hiring to end.`
export const townOfficeCountTruck = (): string => `Trucks to hire`
export const townOfficeCountWorker = (): string => `Workers to hire`
export const townOfficeCountNeeded = (): string => `Hire 1 or more.`
export const townOfficeDelivered = ({ count, delivered }: { readonly count: string | number; readonly delivered: string | number }): string => `${String(delivered)} of ${String(count)} hired`
export const townOfficeDone = (): string => `The hiring is done. Reading your town again…`
export const townOfficeHireTruck = ({ count }: { readonly count: number }): string => `${count === 1 ? `Hire 1 truck` : `Hire ${String(count)} trucks`}`
export const townOfficeHireWorker = ({ count }: { readonly count: number }): string => `${count === 1 ? `Hire 1 worker` : `Hire ${String(count)} workers`}`
export const townOfficeHireAnyTruck = (): string => `Hire trucks`
export const townOfficeHireAnyWorker = (): string => `Hire workers`
export const townOfficeHiring = (): string => `Hiring`
export const townOfficeIdle = (): string => `No hiring now.`
export const townOfficeNeedsLevel = ({ level }: { readonly level: string | number }): string => `Needs office level ${String(level)}`
export const townOfficePeopleName = ({ count }: { readonly count: number }): string => `${count === 1 ? `of your people` : `people`}`
export const townOfficeRefund = (): string => `Stop it and the cost of the hires that did not come comes back to you.`
export const townOfficeStop = (): string => `Stop hiring`
export const townOfficeStopOfTruck = (): string => `Stop hiring trucks`
export const townOfficeStopOfWorker = (): string => `Stop hiring workers`
export const townOfficeTeamTruck = ({ count }: { readonly count: number }): string => `Your team: ${count === 1 ? `1 truck` : `${String(count)} trucks`}`
export const townOfficeTeamWorker = ({ count }: { readonly count: number }): string => `Your team: ${count === 1 ? `1 worker` : `${String(count)} workers`}`
export const townPeople = ({ atWork, free }: { readonly atWork: string | number; readonly free: string | number }): string => `People: ${String(free)} free, ${String(atWork)} at work`
export const townPeopleAtWork = ({ people }: { readonly people: string | number }): string => `People at work: +${String(people)}`
export const townPeopleShort = ({ free, needed }: { readonly free: string | number; readonly needed: string | number }): string => `People needed: ${String(needed)}. Free: ${String(free)}.`
export const townPlacesTitleCity = (): string => `Your city`
export const townPlacesTitleTown = (): string => `Your town`
export const townRate = ({ rate }: { readonly rate: string | number }): string => `+${String(rate)} / h`
export const townSeasonDays = ({ days }: { readonly days: number }): string => `${days === 1 ? `${String(days)} day` : `${String(days)} days`}`
export const townSeasonEndsIn = ({ season, timeLeft }: { readonly season: string | number; readonly timeLeft: string | number }): string => `${String(season)} ends in ${String(timeLeft)}`
export const townSeasonLine = ({ season, year }: { readonly season: string | number; readonly year: string | number }): string => `${String(season)}, year ${String(year)}`
export const townShortMark = (): string => `, you need more`
export const townShortfall = ({ missing }: { readonly missing: string | number }): string => `You need ${String(missing)} more.`
export const townSkylineBuilt = ({ built, total }: { readonly built: string | number; readonly total: string | number }): string => `${String(built)} of ${String(total)} built`
export const townStockOf = ({ capacity }: { readonly capacity: string | number }): string => `of ${String(capacity)}`
export const townStocks = (): string => `In storage`
export const townTipClose = (): string => `Close the tip`
export const townTipFullStore = (): string => `When money, food, power or material is full, your town earns no more of it. Build the storage for more.`
export const townTipJobs = (): string => `Your workers and trucks are free. Send a team on a job on the map for pay.`
export const townTipOffice = (): string => `At the office you can hire workers and trucks. Send them on jobs on the map.`
export const townTipPeople = (): string => `Building work needs free people. Build the homes for more people.`
export const townTipSeasons = (): string => `In spring, summer, fall and winter, your town can earn more, or not as much.`
export const townTipTitle = (): string => `Tip`
export const townTipWaitingList = (): string => `When building work is on, other building work can wait on the waiting list. It starts when that work is ready.`
export const townTopLevel = (): string => `Top level`
export const townTryAgain = (): string => `Try again`
export const townWorkDone = (): string => `The work is done. Reading your town again…`
export const townWorkIdle = (): string => `No building work now.`
export const townWorkReady = (): string => `Ready`
export const townWorkRefund = (): string => `Stop it and all it cost comes back to you. So does the cost of any work on the waiting list that needs it.`
export const townWorkStop = (): string => `Stop the work`
export const townWorkStopOf = ({ level, place }: { readonly level: string | number; readonly place: string | number }): string => `Stop the work: ${String(place)}, level ${String(level)}`
export const townWorkTitle = (): string => `Building work`
export const townWorkWaitingList = (): string => `Waiting list`
export const verificationBannerLine = (): string => `Confirm your email`
export const verificationBannerResend = (): string => `Send again`
export const verificationBannerSent = (): string => `Sent. Check your email.`
export const verificationVerifyTitle = (): string => `Confirm your email`
export const verificationVerifyToTown = (): string => `Go to your town`
export const verificationVerifyVerified = (): string => `Your email is confirmed.`
export const verificationVerifyVerifying = (): string => `Confirming your email…`
