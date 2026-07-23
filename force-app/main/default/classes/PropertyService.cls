public class PropertyService {
    
    /**
     * Validates if a price value is valid (greater than 0).
     * 
     * @param price The price to validate
     * @return true if price is greater than 0, false otherwise
     */
    public static Boolean isPriceValid(Decimal price) {
        return price > 0;
    }
}
