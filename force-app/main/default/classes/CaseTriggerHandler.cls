/**
 * @description Trigger handler for Case object.
 * 
 * ESCALATION AUTOMATION INVENTORY & INTERACTION RISK ASSESSMENT:
 * 
 * === EXISTING ESCALATION LOGIC ===
 * Method: updateCaseStatus(List<Case>, Map<Id, Case>)
 * - Implements Priority → Status mapping (DT-1637)
 * - Triggers on Case update when Priority field changes
 * - Maps: Priority='High' → Status='Escalated'; Priority='Low' → Status='In Progress'
 * - Comments suggest Sub_Status__c field was planned but currently commented out
 * 
 * === INTERACTION RISKS WITH LEGACY AUTOMATION ===
 * 
 * 1. WORKFLOW FIELD UPDATE: Case.ChangePriorityToHigh
 *    Risk Level: HIGH
 *    - Workflow rule may auto-update Case.Priority field
 *    - Could trigger updateCaseStatus() indirectly, creating cascading status changes
 *    - Future Record-Triggered Flow with scheduled escalation path must account for
 *      potential double-firing or race condition if WFU fires between Flow trigger and path execution
 *    - Recommendation: During migration, audit WFU rule criteria and timing
 * 
 * 2. ESCALATION RULE: Case.Test Escalation Rules
 *    Risk Level: HIGH
 *    - Salesforce native escalation rule may reassign or flag Case.IsEscalated
 *    - updateCaseStatus() sets Status='Escalated' but does NOT directly set IsEscalated
 *    - Potential mismatch: Status field updated by Apex ≠ IsEscalated flag from Escalation Rule
 *    - Recommendation: Verify escalation rule criteria do not conflict with Priority-based status logic
 * 
 * 3. CASE TRIGGER: CaseTrigger (after)
 *    Risk Level: MEDIUM
 *    - After-insert/after-update trigger on Case object
 *    - If CaseTrigger also modifies Priority or Status, could chain with updateCaseStatus()
 *    - Recommendation: Coordinate execution order; document trigger call sequence
 * 
 * 4. MANAGED PACKAGE TRIGGERS: LeanData__ContinuousCleanCaseTrigger, slackv2__caseTrigger
 *    Risk Level: MEDIUM
 *    - Both fire on Case DML events
 *    - LeanData continuous clean may modify routing/status fields (LeanData__Routing_Action__c, LeanData__Status_Info__c)
 *    - Slack integration may log/sync Case updates
 *    - Recommendation: Test integration scenarios; ensure no conflicting field updates
 * 
 * === FIELD DEPENDENCIES FOR ESCALATION ===
 * - Case.Priority: Primary trigger for escalation logic (High → Escalated)
 * - Case.Status: Output of escalation logic; also potential Escalation Rule criterion
 * - Case.IsEscalated: Native Salesforce escalation flag; not directly set by this handler
 * - Case.BusinessHoursId: Relevant for scheduled escalation path timing
 * - Case.ClosedDate: Exit condition for scheduled escalation (should not escalate closed cases)
 * - Case.ContactId, Case.ContactEmail: Potential routing for escalation notifications
 * 
 * === FUTURE FLOW MIGRATION NOTES ===
 * When migrating to Record-Triggered Flow with scheduled escalation path:
 * 1. Disable or align Case.ChangePriorityToHigh WFU to prevent double-escalation
 * 2. Verify Escalation Rule IsEscalated flag alignment with Flow-set Status values
 * 3. Add Flow entry condition: Case.ClosedDate IS NULL (do not escalate closed cases)
 * 4. Account for BusinessHoursId in scheduled path wait conditions
 * 5. Test interaction between Flow and LeanData/Slack triggers
 * 6. Document new escalation logic (Flow path) vs. legacy logic (updateCaseStatus) decommissioning timeline
 */
public class CaseTriggerHandler {
    
    /**
     * @description Insert Case Subject if blank
     * @param newCases List of newly inserted Case records
     */
    public static void insertCaseNames(List<Case> newCases) {
        for (Case newCase : newCases) {
            if (String.isBlank(newCase.Subject)) {
                newCase.Subject = 'Case-' + System.now().format('yyyyMMddHHmmss');
            }
        }
    }
    
    /**
     * @description Update Case Status and Sub Status based on Priority field changes.
     * 
     * ESCALATION LOGIC (DT-1637):
     * - Priority='High' → Status='Escalated' (escalation entry point)
     * - Priority='Low' → Status='In Progress'
     * - Other → Status='In Progress'
     * 
     * ⚠️ INTERACTION ALERT: This method may be invoked indirectly by:
     *    - Workflow Field Update (Case.ChangePriorityToHigh) setting Priority automatically
     *    - Escalation Rule (Case.Test Escalation Rules) reassigning case or setting IsEscalated
     *    - Future Record-Triggered Flow with scheduled escalation path (planned migration target)
     * 
     * AUDIT TRAIL: All status changes are visible in Case field history (Status field tracked).
     * 
     * @param updatedCases List of Cases with updated field values
     * @param oldCaseMap Map of Case Id → prior Case state
     */
    public static void updateCaseStatus(List<Case> updatedCases, Map<Id, Case> oldCaseMap) {
        for (Case updatedCase : updatedCases) {
            Case oldCase = oldCaseMap.get(updatedCase.Id);
            
            // Priority change detection: if Priority has changed, evaluate new Status
            if (updatedCase.Priority != oldCase.Priority) {
                // ESCALATION ENTRY: High priority → Escalated status
                if (updatedCase.Priority == 'High') {
                    updatedCase.Status = 'Escalated';
                    // NOTE: Sub_Status__c field is commented out pending business requirements alignment.
                    // Uncomment after confirming Sub_Status__c custom field exists and is part of escalation rules.
                    // updatedCase.Sub_Status__c = 'In Progress';
                }
                // De-escalation: Low priority → In Progress status
                else if (updatedCase.Priority == 'Low') {
                    updatedCase.Status = 'In Progress';
                    // updatedCase.Sub_Status__c = 'Waiting for Customer';
                }
                // Fallback for other priority values
                else {
                    updatedCase.Status = 'In Progress';
                    // updatedCase.Sub_Status__c = 'Under Review';
                }
            }
            // If Priority has not changed, preserve existing Status unless other business rules apply
            // (No action taken; Status remains as is)
        }
    }
}