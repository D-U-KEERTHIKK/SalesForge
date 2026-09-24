/**
 * OpportunityHighValueDealTriggerHandler
 * 
 * Trigger handler class that encapsulates business logic for detecting and publishing
 * high-value Opportunity closures. Filters newly closed Opportunities from trigger context
 * and delegates to OpportunityHighValueDealEventPublisher for Platform Event publication.
 */
public class OpportunityHighValueDealTriggerHandler {

  /** Minimum Amount threshold for triggering high-value deal event (in dollars) */
  private static final Decimal HIGH_VALUE_THRESHOLD = 100000;

  /**
   * Handles after-insert and after-update trigger events on Opportunity.
   * Filters for newly Closed Won opportunities with Amount >= threshold and publishes events.
   *
   * @param newOpportunities List of new/updated Opportunity records from trigger context
   * @param oldOpportunitiesMap Map of old Opportunity records (null for after-insert)
   */
  public static void handleOpportunityTrigger(
    List<Opportunity> newOpportunities,
    Map<Id, Opportunity> oldOpportunitiesMap
  ) {
    List<Opportunity> highValueClosedDeals = filterHighValueClosedDeals(
      newOpportunities,
      oldOpportunitiesMap
    );

    if (!highValueClosedDeals.isEmpty()) {
      OpportunityHighValueDealEventPublisher.publishHighValueDealEvents(highValueClosedDeals);
    }
  }

  /**
   * Filters Opportunities that are newly Closed Won with Amount >= HIGH_VALUE_THRESHOLD.
   * Handles both after-insert (oldMap is null) and after-update (oldMap contains prior state) scenarios.
   *
   * @param newOpportunities List of new/updated Opportunity records
   * @param oldOpportunitiesMap Map of prior Opportunity state; null for after-insert
   * @return List of Opportunities matching high-value closed deal criteria
   */
  private static List<Opportunity> filterHighValueClosedDeals(
    List<Opportunity> newOpportunities,
    Map<Id, Opportunity> oldOpportunitiesMap
  ) {
    List<Opportunity> filtered = new List<Opportunity>();

    for (Opportunity opp : newOpportunities) {
      // Check if Amount meets high-value threshold
      if (opp.Amount == null || opp.Amount < HIGH_VALUE_THRESHOLD) {
        continue;
      }

      // Check if StageName is Closed Won
      if (opp.StageName != 'Closed Won') {
        continue;
      }

      // For after-insert: include any Closed Won high-value opp
      // For after-update: only include if stage changed TO Closed Won
      if (oldOpportunitiesMap == null) {
        // After-insert scenario
        filtered.add(opp);
      } else {
        // After-update scenario: verify transition to Closed Won
        Opportunity oldOpp = oldOpportunitiesMap.get(opp.Id);
        if (oldOpp != null && oldOpp.StageName != 'Closed Won') {
          filtered.add(opp);
        }
      }
    }

    return filtered;
  }
}