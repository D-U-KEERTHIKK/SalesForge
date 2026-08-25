/**
 * @description Trigger on Session_Feedback__c to detect overbooked sessions.
 *              Fires after insert and after delete to recount feedback and
 *              update the Overbooked__c flag on the related Session__c.
 * @author      AgentForge — DF-5
 */
trigger SessionFeedbackTrigger on Session_Feedback__c (after insert, after delete) {
    List<Session_Feedback__c> records = Trigger.isInsert ? Trigger.new : Trigger.old;
    SessionFeedbackTriggerHandler.handleOverbooking(records);
}
