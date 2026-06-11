"""
Chatbot service - glues AI extraction with job search and SPA search
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.jobs import services as job_services
from app.modules.jobs.models import Job
from app.modules.spas import services as spa_services
from app.modules.spas.models import Spa
from app.modules.chatbot.ai_client import extract_filters


def format_job_for_chatbot(job: Job) -> dict:
    """Format a Job model instance for chatbot response"""
    location_parts = []
    if job.city:
        location_parts.append(job.city.name)
    if job.area:
        location_parts.append(job.area.name)
    if job.state:
        location_parts.append(job.state.name)
    
    location = ", ".join(location_parts) if location_parts else "Location not specified"
    
    # Format salary
    salary = None
    if job.salary_min or job.salary_max:
        salary_parts = []
        if job.salary_min:
            salary_parts.append(f"{job.salary_currency or 'INR'} {job.salary_min:,}")
        if job.salary_max:
            salary_parts.append(f"{job.salary_currency or 'INR'} {job.salary_max:,}")
        salary = " - ".join(salary_parts) if len(salary_parts) > 1 else salary_parts[0]
    
    spa_name = job.spa.name if job.spa else "Unknown SPA"
    
    return {
        "id": job.id,
        "title": job.title,
        "spa_name": spa_name,
        "location": location,
        "salary": salary,
        "slug": job.slug,
        "apply_url": f"/jobs/{job.slug}",
    }


def format_spa_for_chatbot(spa: Spa) -> dict:
    """Format a Spa model instance for chatbot response"""
    location_parts = []
    if spa.city:
        location_parts.append(spa.city.name)
    if spa.area:
        location_parts.append(spa.area.name)
    if spa.state:
        location_parts.append(spa.state.name)
    
    location = ", ".join(location_parts) if location_parts else "Location not specified"
    
    return {
        "id": spa.id,
        "name": spa.name,
        "location": location,
        "address": spa.address,
        "phone": spa.phone,
        "rating": spa.rating,
        "slug": spa.slug,
        "view_url": f"/spas/{spa.slug}",
    }


def get_suggested_queries(filters: dict, has_location: bool = False) -> List[str]:
    """Generate suggested queries based on current filters"""
    suggestions = []
    
    if filters["intent"] == "greeting":
        suggestions = [
            "Find spa therapist jobs in Mumbai",
            "Show me part-time jobs near me",
            "Find spas near me",
            "Massage therapist jobs in Delhi",
        ]
    elif filters["intent"] == "job_search":
        if filters["city"]:
            city = filters["city"]
            suggestions = [
                f"Find all Work Spa in {city}",
                f"Part-time jobs in {city}",
                f"Full-time therapist jobs in {city}",
                f"Spa manager jobs in {city}",
            ]
        elif filters["near_me"]:
            suggestions = [
                "Find all jobs near me",
                "Part-time jobs nearby",
                "Therapist jobs near me",
                "Work Spa nearby",
            ]
        else:
            suggestions = [
                "Find jobs in Mumbai",
                "Find jobs in Delhi",
                "Show part-time jobs",
                "Therapist jobs",
            ]
    elif filters["intent"] == "spa_search":
        if filters["city"]:
            city = filters["city"]
            suggestions = [
                f"Find spas in {city}",
                f"Best spas in {city}",
                f"Spas near me in {city}",
                f"Top spas in {city}",
            ]
        elif filters["near_me"]:
            suggestions = [
                "Find spas near me",
                "Best spas nearby",
                "Top spas near me",
                "Spas close to me",
            ]
        else:
            suggestions = [
                "Find spas in Mumbai",
                "Find spas in Delhi",
                "Best spas near me",
                "Top spas",
            ]
    else:
        suggestions = [
            "Find Work Spa in Mumbai",
            "Show spas near me",
            "Therapist jobs in Delhi",
            "Part-time Work Spa",
        ]
    
    return suggestions[:4]  # Return max 4 suggestions


async def chatbot_search(
    db: Session,
    message: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> dict:
    """
    Main chatbot search function.
    Extracts filters from message and searches jobs OR SPAs (not both) using existing services.
    
    IMPORTANT: Returns ONLY jobs if intent is "job_search", ONLY spas if intent is "spa_search".
    """
    # Extract filters from user message
    filters = await extract_filters(message)
    
    # Handle greeting
    if filters["intent"] == "greeting":
        suggestions = get_suggested_queries(filters, has_location=bool(latitude and longitude))
        return {
            "message": "Hello! I can help you find Work Spa and spas. What are you looking for?",
            "jobs": [],
            "spas": [],
            "suggestions": suggestions,
        }
    
    # Handle unknown intent
    if filters["intent"] == "unknown":
        suggestions = get_suggested_queries(filters, has_location=bool(latitude and longitude))
        return {
            "message": "I can help you find Work Spa and spas. Try asking like 'I need therapist jobs in Mumbai' or 'Show me spas near me'.",
            "jobs": [],
            "spas": [],
            "suggestions": suggestions,
        }
    
    formatted_jobs = []
    formatted_spas = []
    
    # STRICT SEPARATION: Search for jobs ONLY if intent is job_search
    if filters["intent"] == "job_search":
        # Get all active jobs (we'll filter them)
        all_jobs = job_services.get_jobs(
            db=db,
            skip=0,
            limit=500,  # Get more jobs to filter
            job_type=filters["job_type"],
            job_category=None,  # We'll filter by role name
        )
        
        import re
        message_lower = message.lower()
        
        # Advanced Dynamic Detection: dynamically check if any job's area, city, or role is mentioned
        mentioned_areas = set()
        mentioned_cities = set()
        mentioned_roles = set()
        
        for job in all_jobs:
            if job.area and job.area.name:
                area_name = job.area.name.lower()
                if len(area_name) >= 3 and re.search(r'\b' + re.escape(area_name) + r'\b', message_lower):
                    mentioned_areas.add(area_name)
                    
            if job.city and job.city.name:
                city_name = job.city.name.lower()
                if len(city_name) >= 3 and re.search(r'\b' + re.escape(city_name) + r'\b', message_lower):
                    mentioned_cities.add(city_name)
                    
            if job.job_category and job.job_category.name:
                role_name = job.job_category.name.lower()
                # Split category names if they have spaces to match partials (e.g., "Spa Therapist" -> "Therapist")
                role_parts = [r.strip() for r in role_name.split(' ')] + [role_name]
                for part in role_parts:
                    if len(part) >= 3 and re.search(r'\b' + re.escape(part) + r'\b', message_lower):
                        mentioned_roles.add(role_name)

        # Filter jobs based on extracted criteria
        filtered_jobs = []
        for job in all_jobs:
            # Filter by job role (dynamic or AI fallback)
            if mentioned_roles or filters["job_role"]:
                job_cat = job.job_category.name.lower() if job.job_category else ""
                if mentioned_roles:
                    if job_cat not in mentioned_roles:
                        continue
                elif filters["job_role"] and filters["job_role"].lower() not in job_cat:
                    continue
            
            # Filter by city (dynamic or AI fallback)
            if mentioned_cities or filters["city"]:
                job_city = job.city.name.lower() if job.city else ""
                if mentioned_cities:
                    if job_city not in mentioned_cities:
                        continue
                elif filters["city"] and filters["city"].lower() not in job_city:
                    continue
                        
            # Filter by dynamic area
            if mentioned_areas:
                if not job.area or job.area.name.lower() not in mentioned_areas:
                    continue
            
            # Filter by "near me" using coordinates
            if filters["near_me"] and latitude and longitude:
                if job.latitude and job.longitude:
                    from app.utils.geo_utils import calculate_distance
                    distance = calculate_distance(latitude, longitude, job.latitude, job.longitude)
                    if distance > 10:  # Within 10km
                        continue
            
            filtered_jobs.append(job)
            
            # Limit results to 15
            if len(filtered_jobs) >= 15:
                break
        
        # Format jobs for response
        formatted_jobs = [format_job_for_chatbot(job) for job in filtered_jobs]
        
        # Generate response message for jobs
        if formatted_jobs:
            message_text = f"I found {len(formatted_jobs)} job{'s' if len(formatted_jobs) > 1 else ''} matching your search."
        else:
            message_text = "I couldn't find any jobs matching your criteria. Try adjusting your search terms."
        
        suggestions = get_suggested_queries(filters, has_location=bool(latitude and longitude))
        
        return {
            "message": message_text,
            "jobs": formatted_jobs,
            "spas": [],  # Always empty for job_search
            "suggestions": suggestions,
        }
    
    # STRICT SEPARATION: Search for SPAs ONLY if intent is spa_search
    elif filters["intent"] == "spa_search":
        import re
        message_lower = message.lower()
        all_spas_to_check = spa_services.get_spas(db, skip=0, limit=500, is_active=True)
        
        # Advanced Detection for SPAs
        mentioned_areas = set()
        mentioned_cities = set()
        for spa in all_spas_to_check:
            if spa.area and spa.area.name:
                area_name = spa.area.name.lower()
                if len(area_name) >= 3 and re.search(r'\b' + re.escape(area_name) + r'\b', message_lower):
                    mentioned_areas.add(area_name)
                    
            if spa.city and spa.city.name:
                city_name = spa.city.name.lower()
                if len(city_name) >= 3 and re.search(r'\b' + re.escape(city_name) + r'\b', message_lower):
                    mentioned_cities.add(city_name)
                    
        if filters["near_me"] and latitude and longitude:
            # Get SPAs near location
            nearby_spas = spa_services.get_spas_near_location(db, latitude, longitude, radius_km=10)
            formatted_spas = [format_spa_for_chatbot(spa) for spa in nearby_spas[:15]]
        elif filters["city"] or mentioned_cities or mentioned_areas:
            # Get SPAs by city or area
            filtered_spas = []
            for spa in all_spas_to_check:
                if mentioned_cities or filters["city"]:
                    spa_city = spa.city.name.lower() if spa.city else ""
                    if mentioned_cities:
                        if spa_city not in mentioned_cities:
                            continue
                    elif filters["city"] and filters["city"].lower() not in spa_city:
                        continue
                        
                if mentioned_areas:
                    if not spa.area or spa.area.name.lower() not in mentioned_areas:
                        continue
                        
                filtered_spas.append(spa)
                if len(filtered_spas) >= 15:
                    break
            formatted_spas = [format_spa_for_chatbot(spa) for spa in filtered_spas]
        else:
            # Get all active SPAs
            all_spas = spa_services.get_spas(db, skip=0, limit=15, is_active=True)
            formatted_spas = [format_spa_for_chatbot(spa) for spa in all_spas]
        
        # Generate response message for spas
        if formatted_spas:
            message_text = f"I found {len(formatted_spas)} spa{'s' if len(formatted_spas) > 1 else ''} matching your search."
        else:
            message_text = "I couldn't find any spas matching your criteria. Try adjusting your search terms."
        
        suggestions = get_suggested_queries(filters, has_location=bool(latitude and longitude))
        
        return {
            "message": message_text,
            "jobs": [],  # Always empty for spa_search
            "spas": formatted_spas,
            "suggestions": suggestions,
        }
    
    # Fallback (should not reach here, but just in case)
    suggestions = get_suggested_queries(filters, has_location=bool(latitude and longitude))
    return {
        "message": "I can help you find Work Spa and spas. Please specify what you're looking for.",
        "jobs": [],
        "spas": [],
        "suggestions": suggestions,
    }

