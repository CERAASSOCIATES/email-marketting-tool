import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Container,
  Paper,
  Snackbar,
  Alert,
  useMediaQuery
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTheme } from '@mui/material/styles';

const UploadForm = () => {
  const [excelFile, setExcelFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const excelInputRef = useRef();
  const imageInputRef = useRef();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile || !subject || !message) {
      alert('Please fill all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', excelFile);
    imageFiles.forEach((file) => {
      formData.append('imageFiles', file);
    });
    formData.append('subject', subject);
    formData.append('message', message);

    setLoading(true);

    try {
      const res = await axios.post('https://email-marketting-tool-1.onrender.com/send-emails', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSnackbarMessage(res.data.message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Reset form fields
      setExcelFile(null);
      setImageFiles([]);
      setSubject('');
      setMessage('');
      if (excelInputRef.current) excelInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || 'Failed to send emails. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 3,
          maxWidth: 800,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#fff',
        }}
      >
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          sx={{ fontWeight: 700, color: '#3f51b5', mb: 4, textAlign: 'center' }}
        >
          Email Automation Tool
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <TextField
              type="file"
              accept=".xlsx"
              inputRef={excelInputRef}
              onChange={(e) => setExcelFile(e.target.files[0])}
              fullWidth
              required
              label="Upload Excel File (.xlsx)"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              sx={{ backgroundColor: '#fafafa' }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              type="file"
              accept="image/*"
              inputRef={imageInputRef}
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
              fullWidth
              label="Upload Images (optional)"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              inputProps={{ multiple: true }}
              sx={{ backgroundColor: '#fafafa' }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              required
              label="Subject"
              variant="outlined"
              sx={{ backgroundColor: '#fafafa' }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              required
              label="Message"
              variant="outlined"
              multiline
              rows={6}
              sx={{ backgroundColor: '#fafafa' }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: '16px',
              fontWeight: 600,
              backgroundColor: '#3f51b5',
              '&:hover': { backgroundColor: '#303f9f' },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              <>
                <CloudUploadIcon sx={{ mr: 1 }} />
                Send Emails
              </>
            )}
          </Button>

          {loading && (
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#888' }}>
              Sending emails... Please wait.
            </Typography>
          )}
        </form>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ width: '100%', backgroundColor: '#3f51b5', color: '#fff' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default UploadForm;
