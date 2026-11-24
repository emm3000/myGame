package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.hiring.TownHiringRefusal
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.feature.town.R

internal fun CopyReader.hiringRefusalLineOf(refusal: TownHiringRefusal): String = when (refusal) {
    is TownHiringRefusal.OfficeTooLow -> text(
        R.string.town_refusal_office_too_low,
        "officeLevel" to refusal.officeLevel.toString(),
        "requiredOfficeLevel" to refusal.requiredOfficeLevel.toString(),
    )
    TownHiringRefusal.HiringSlotBusy -> text(R.string.town_refusal_hiring_slot_busy)
    is TownHiringRefusal.NotEnoughPeople -> text(
        R.string.town_refusal_hiring_not_enough_people,
        "requiredPeople" to refusal.required,
        "freePeople" to refusal.free.toString(),
    )
    TownHiringRefusal.NotEnoughResources -> text(R.string.town_refusal_hiring_not_enough_resources)
    TownHiringRefusal.HiringOrderNotFound -> text(R.string.town_refusal_hiring_order_not_found)
    TownHiringRefusal.TownNotFound -> text(R.string.town_refusal_town_not_found)
    TownHiringRefusal.Unrecognized -> text(R.string.town_refusal_unexpected)
}
