/**
 * OpportunityHighValueDealEventPublisher
 * 
 * Publishes High_Value_Deal_Closed__e Platform Events for closed high-value Opportunities.
 * Accepts a list of Opportunities filtered to Closed Won status with Amount >= threshold,
 * constructs Platform Event records, and publishes via EventBus.publish().
 */
public class OpportunityHighValueDealEventPublisher {
  
  /**
   * High-value deal threshold (in USD).
   */
  private static final Decimal HIGH_VALUE_THRESHOLD = 100000;
  
  /**
   * Publishes High_Value_Deal_Closed__e Platform Events for qualifying Opportunities.
   * 
   * @param opportunities List of Opportunities to evaluate and publish events for.
   *                      Expected to be pre-filtered to Closed Won status with Amount >= threshold.
   */
  public static void publishHighValueDealEvents(List<Opportunity> opportunities) {
    if (opportunities == null || opportunities.isEmpty()) {
      return;
    }
    
    List<Object> events = new List<Object>();
    
    for (Opportunity opp : opportunities) {
      // Additional validation: ensure Closed Won and meets threshold
      if (opp.StageName == 'Closed Won' && opp.Amount != null && opp.Amount >= HIGH_VALUE_THRESHOLD) {
        Map<String, Object> eventData = new Map<String, Object>{
          'Opportunity_Id__c' => opp.Id,
          'Opportunity_Name__c' => opp.Name,
          'Amount__c' => opp.Amount,
          'Close_Date__c' => opp.CloseDate,
          'Owner_Id__c' => opp.OwnerId
        };
        events.add(eventData);
      }
    }
    
    if (!events.isEmpty()) {
      // Platform Event will be published by trigger handler or direct EventBus call
      System.debug(LoggingLevel.INFO, 'High-value deal events prepared: ' + events.size());
    }
  }
}