trigger SessionFeedbackTrigger on Session_Feedback__c (after insert, after delete) {
    SessionFeedbackTriggerHandler.checkOverbooking(
        Trigger.isInsert ? Trigger.new : Trigger.old
    );
}
