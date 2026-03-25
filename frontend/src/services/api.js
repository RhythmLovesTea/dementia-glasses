import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ── Face ─────────────────────────────────────────────────────────────────────

/**
 * Upload a photo and register the face encoding.
 * Returns { face_index, photo_url }
 */
export const registerFace = async (imageBlob, filename = 'face.jpg') => {
  const form = new FormData();
  form.append('file', imageBlob, filename);
  const { data } = await api.post('/api/face/register', form);
  return data; // { face_index, photo_url }
};

export const recognizeFace = async (imageBlob, filename = 'frame.jpg') => {
  const form = new FormData();
  form.append('file', imageBlob, filename);
  const { data } = await api.post('/api/face/recognize', form);
  return data; // { match_id }
};

// ── People ────────────────────────────────────────────────────────────────────

export const getPeople = async () => {
  const { data } = await api.get('/api/memory/people');
  return data;
};

export const getPerson = async (personId) => {
  const { data } = await api.get(`/api/memory/people/${personId}`);
  return data;
};

export const createPerson = async (payload) => {
  const { data } = await api.post('/api/memory/people', payload);
  return data;
};

export const updatePerson = async (personId, payload) => {
  const { data } = await api.put(`/api/memory/people/${personId}`, payload);
  return data;
};

export const deletePerson = async (personId) => {
  await api.delete(`/api/memory/people/${personId}`);
};

// ── Memories ──────────────────────────────────────────────────────────────────

export const getMemories = async (personId) => {
  const { data } = await api.get(`/api/memory/${personId}`);
  return data;
};

export const addMemory = async (personId, memory) => {
  const { data } = await api.post(`/api/memory/${personId}`, memory);
  return data;
};

export const deleteMemory = async (personId, memoryId) => {
  await api.delete(`/api/memory/${personId}/memories/${memoryId}`);
};

export const getMemorySummary = async (personId) => {
  const { data } = await api.get(`/api/memory/${personId}/summary`);
  return data; // { summary }
};

// ── Conversation ──────────────────────────────────────────────────────────────

export const sendAudio = async (audioBlob, personId) => {
  const form = new FormData();
  form.append('file', audioBlob, 'recording.webm');
  if (personId) form.append('person_id', personId);
  const { data } = await api.post('/api/conversation/audio', form);
  return data; // { transcript, response }
};

export default api;
