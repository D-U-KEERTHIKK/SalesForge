trigger OpportunityHighValueDealTrigger on Opportunity (after insert, after update) {
  OpportunityHighValueDealTriggerHandler.handleOpportunityTrigger(
    Trigger.new,
    Trigger.oldMap
  );
}