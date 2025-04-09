const supabase = require('../config/supabaseClient');

// Create a contact
const createContact = async (data) => {
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert([data])
    .select();

  if (error) throw error;
  return contact;
};

// Get all contacts
const getContacts = async () => {
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*');

  if (error) throw error;
  return contacts;
};

// Delete a contact by id
const deleteContact = async (id) => {
  const { data, error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return data;
};

module.exports = {
  createContact,
  getContacts,
  deleteContact,
};
