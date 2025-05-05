from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.contact import Contact
import json
import traceback

contacts_bp = Blueprint('contacts', __name__)

@contacts_bp.route('/simple-test', methods=['GET'])
def simple_test():
    """Test endpoint that doesn't require authentication"""
    return jsonify({'message': 'Simple test endpoint working (no auth required)'}), 200

@contacts_bp.route('/', methods=['GET'])
@jwt_required()
def get_contacts():
    """Get all contacts for the current user with optional pagination and search"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        
        # Base query
        query = Contact.query.filter_by(user_id=current_user_id)
        
        # Add search if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Contact.first_name.ilike(search_term),
                    Contact.last_name.ilike(search_term),
                    Contact.company.ilike(search_term)
                )
            )
        
        # Get total count before pagination
        total_contacts = query.count()
        
        # Apply pagination
        paginated_contacts = query.limit(per_page).offset((page - 1) * per_page).all()
        
        # Calculate total pages
        total_pages = (total_contacts + per_page - 1) // per_page if total_contacts > 0 else 1
        
        # Prepare response
        contacts_list = []
        for contact in paginated_contacts:
            contacts_list.append({
                'id': contact.id,
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'address': contact.address,
                'company': contact.company,
                'phone_numbers': json.loads(contact.phone_numbers) if contact.phone_numbers else []
            })
        
        return jsonify({
            'contacts': contacts_list,
            'page': page,
            'per_page': per_page,
            'total': total_contacts,
            'pages': total_pages
        }), 200
    except Exception as e:
        print(f"Error getting contacts: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/', methods=['POST'])
@jwt_required()
def create_contact():
    """Create a new contact"""
    try:
        # Get user ID from JWT token
        current_user_id = get_jwt_identity()
        
        # Get contact data from request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Validate required fields
        if not data.get('first_name') or not data.get('last_name'):
            return jsonify({'error': 'First name and last name are required'}), 400
            
        # Process phone numbers
        from app.utils.helpers import ensure_json_string
        phone_numbers = ensure_json_string(data.get('phone_numbers', []))
        
        # Create new contact
        contact = Contact(
            user_id=current_user_id,
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            address=data.get('address', ''),
            company=data.get('company', ''),
            phone_numbers=phone_numbers
        )
        
        # Save to database
        db.session.add(contact)
        db.session.commit()
        
        # Return success response
        return jsonify({
            'message': 'Contact created successfully',
            'contact': {
                'id': contact.id,
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'address': contact.address,
                'company': contact.company,
                'phone_numbers': json.loads(contact.phone_numbers) if contact.phone_numbers else []
            }
        }), 201
    except Exception as e:
        print(f"Error creating contact: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_contact(id):
    """Get a single contact by ID"""
    try:
        current_user_id = get_jwt_identity()
        contact = Contact.query.filter_by(id=id, user_id=current_user_id).first()
        
        if not contact:
            return jsonify({'error': 'Contact not found'}), 404
            
        return jsonify({
            'id': contact.id,
            'first_name': contact.first_name,
            'last_name': contact.last_name,
            'address': contact.address,
            'company': contact.company,
            'phone_numbers': json.loads(contact.phone_numbers) if contact.phone_numbers else []
        }), 200
    except Exception as e:
        print(f"Error getting contact: {str(e)}")
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_contact(id):
    """Delete a contact by ID"""
    try:
        current_user_id = get_jwt_identity()
        contact = Contact.query.filter_by(id=id, user_id=current_user_id).first()
        
        if not contact:
            return jsonify({'error': 'Contact not found'}), 404
            
        db.session.delete(contact)
        db.session.commit()
        
        return jsonify({'message': 'Contact deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting contact: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_contact(id):
    """Update a contact by ID"""
    try:
        current_user_id = get_jwt_identity()
        contact = Contact.query.filter_by(id=id, user_id=current_user_id).first()
        
        if not contact:
            return jsonify({'error': 'Contact not found'}), 404
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Update contact fields
        if 'first_name' in data:
            contact.first_name = data['first_name']
        if 'last_name' in data:
            contact.last_name = data['last_name']
        if 'address' in data:
            contact.address = data['address']
        if 'company' in data:
            contact.company = data['company']
        if 'phone_numbers' in data:
            from app.utils.helpers import ensure_json_string
            contact.phone_numbers = ensure_json_string(data['phone_numbers'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Contact updated successfully',
            'contact': {
                'id': contact.id,
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'address': contact.address,
                'company': contact.company,
                'phone_numbers': json.loads(contact.phone_numbers) if contact.phone_numbers else []
            }
        }), 200
    except Exception as e:
        print(f"Error updating contact: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500