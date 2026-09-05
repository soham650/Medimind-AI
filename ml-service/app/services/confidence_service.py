from typing import List

def calculate_confidence_tag(probabilities: List[float]) -> str:
    """
    Calculates the confidence tag (High/Medium/Low) based on the gap 
    between the top-2 predicted probabilities.
    """
    if not probabilities:
        return "Low"
        
    # Sort probabilities in descending order
    sorted_probs = sorted(probabilities, reverse=True)
    
    if len(sorted_probs) < 2:
        return "High" if sorted_probs[0] > 0.5 else "Medium"
        
    gap = sorted_probs[0] - sorted_probs[1]
    
    if gap > 0.30:
        return "High"
    elif gap >= 0.15:
        return "Medium"
    else:
        return "Low"
