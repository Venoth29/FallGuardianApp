import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardTypeOptions, ScrollView, Button } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import CustomAlert from './CustomAlert';

// --- Types & Components ---
type Contact = { id: string; name: string; phone: string; email?: string; };
type InputFieldProps = { label: string; value: string; onChangeText: (text: string) => void; placeholder?: string; keyboardType?: KeyboardTypeOptions; };
type PrimaryButtonProps = { title: string; onPress: () => void; style?: object; };
const InputField: React.FC<InputFieldProps> = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }) => ( <View style={styles.inputGroup}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} autoCapitalize="none" /></View> );
const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, style }) => ( <TouchableOpacity style={[styles.button, style]} onPress={onPress}><Text style={styles.buttonText}>{title}</Text></TouchableOpacity> );

// --- The Contacts Screen Component ---
const ContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void; }>({ isVisible: false, message: '', type: 'success' });
  const currentUserId = auth().currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;
    const contactsCollection = firestore().collection('users').doc(currentUserId).collection('emergencyContacts').orderBy('createdAt', 'asc');
    const subscriber = contactsCollection.onSnapshot(querySnapshot => {
      const fetchedContacts: Contact[] = [];
      querySnapshot.forEach(documentSnapshot => { fetchedContacts.push({ ...documentSnapshot.data(), id: documentSnapshot.id } as Contact); });
      setContacts(fetchedContacts);
    });
    return () => subscriber();
  }, [currentUserId]);

    const handleAddOrUpdateContact = async () => {
        if (!newContactName || !newContactPhone) {
          setAlertInfo({ isVisible: true, message: 'Please enter a name and phone number.', type: 'error' });
          return;
        }
        if (!currentUserId) return;
        const contactsCollection = firestore().collection('users').doc(currentUserId).collection('emergencyContacts');
        const contactData = { name: newContactName, phone: newContactPhone, email: newContactEmail };
    
        try {
          if (editingContactId) {
            await contactsCollection.doc(editingContactId).update({
                ...contactData,
                lastUpdatedAt: firestore.FieldValue.serverTimestamp(),
            });
            setAlertInfo({ isVisible: true, message: 'Contact has been updated!', type: 'success' });
          } else {
            await contactsCollection.add({ 
                ...contactData, 
                createdAt: firestore.FieldValue.serverTimestamp(),
            });
            setAlertInfo({ isVisible: true, message: 'Contact has been saved!', type: 'success' });
          }
          setNewContactName(''); setNewContactPhone(''); setNewContactEmail(''); setEditingContactId(null);
        } catch (error) {
          console.error("Error saving contact: ", error);
          setAlertInfo({ isVisible: true, message: 'Could not save the contact.', type: 'error' });
        }
    };

    const handleEditClick = (contact: Contact) => {
        setEditingContactId(contact.id);
        setNewContactName(contact.name);
        setNewContactPhone(contact.phone);
        setNewContactEmail(contact.email || '');
    };

    const handleCancelEdit = () => {
        setEditingContactId(null);
        setNewContactName('');
        setNewContactPhone('');
        setNewContactEmail('');
    };

    const handleDeleteContact = (contactId: string) => {
        if (!currentUserId) return;
        setAlertInfo({
          isVisible: true,
          message: "Are you sure you want to delete this contact?",
          type: 'confirm',
          onConfirm: () => {
            firestore().collection('users').doc(currentUserId).collection('emergencyContacts').doc(contactId).delete()
              .then(() => { setAlertInfo({ isVisible: true, message: 'Contact deleted.', type: 'success' }); })
              .catch(() => { setAlertInfo({ isVisible: true, message: 'Could not delete contact.', type: 'error' }); });
          }
        });
    };

  return (
    // --- FIXED: Using a ScrollView as the main container for stability ---
    <View style={styles.container}>
        <ScrollView>
            <Text style={styles.header}>Manage Emergency Contacts</Text>
            <InputField label="Name" value={newContactName} onChangeText={setNewContactName} placeholder="Contact Name" />
            <InputField label="Phone" value={newContactPhone} onChangeText={setNewContactPhone} placeholder="Phone Number" keyboardType="phone-pad" />
            <InputField label="Email (Optional)" value={newContactEmail} onChangeText={setNewContactEmail} placeholder="Email Address" keyboardType="email-address" />
            <PrimaryButton title={editingContactId ? 'Update Contact' : 'Add Contact'} onPress={handleAddOrUpdateContact} />
            {editingContactId && (<View style={{marginTop: 10}}><Button title="Cancel Edit" onPress={handleCancelEdit} color="#757575" /></View>)}
            
            <View style={styles.contactListContainer}>
              <Text style={styles.listHeader}>Saved Contacts</Text>
              {contacts.length === 0 ? (
                <Text style={styles.noContactsText}>No emergency contacts added yet.</Text>
              ) : (
                // --- FIXED: Displaying contacts with a simple map function ---
                contacts.map(item => (
                    <View key={item.id} style={styles.contactItem}>
                        <View>
                            <Text style={styles.contactName}>{item.name}</Text>
                            <Text style={styles.contactDetail}>{item.phone}</Text>
                        </View>
                        <View style={{flexDirection: 'row'}}>
                            <TouchableOpacity style={styles.editButton} onPress={() => handleEditClick(item)}><Text style={styles.editButtonText}>Edit</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteContact(item.id)}><Text style={styles.deleteButtonText}>Delete</Text></TouchableOpacity>
                        </View>
                    </View>
                ))
              )}
            </View>
        </ScrollView>
        {/* The Alert is a sibling to the ScrollView, which is correct */}
        <CustomAlert 
            isVisible={alertInfo.isVisible} 
            message={alertInfo.message} 
            type={alertInfo.type} 
            onClose={() => setAlertInfo({ ...alertInfo, isVisible: false })} 
            onConfirm={alertInfo.onConfirm} 
        />
    </View>
  );
};


// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center', paddingTop: 20, paddingHorizontal: 20 },
  inputGroup: { marginBottom: 15, paddingHorizontal: 20 },
  label: { fontSize: 16, color: '#424242', marginBottom: 5 },
  input: { height: 45, borderColor: '#bdbdbd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#1976d2', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10, marginHorizontal: 20 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  contactListContainer: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 20, paddingHorizontal: 20 },
  listHeader: { fontSize: 18, fontWeight: 'bold', color: '#424242', marginBottom: 10 },
  noContactsText: { textAlign: 'center', color: '#757575', fontSize: 16, paddingBottom: 20 },
  contactItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 1 },
  contactName: { fontSize: 18, fontWeight: 'bold' },
  contactDetail: { fontSize: 14, color: '#666' },
  editButton: { padding: 8, marginRight: 8 },
  editButtonText: { color: '#1976d2', fontWeight: 'bold' },
  deleteButton: { padding: 8 },
  deleteButtonText: { color: '#ef5350', fontWeight: 'bold' }
});

export default ContactsScreen;