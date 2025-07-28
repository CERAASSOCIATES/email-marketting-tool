import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Button, TextField, Typography, Box, CircularProgress, Container, Paper,
  Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Snackbar, Alert, useMediaQuery, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const UploadForm = () => {
  const [excelFile, setExcelFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailResults, setEmailResults] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const excelInputRef = useRef();
  const imageInputRef = useRef();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!excelFile || !subject || !message) {
      alert('Please fill all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', excelFile);
    imageFiles.forEach(file => formData.append('imageFiles', file));
    formData.append('subject', subject);
    formData.append('message', message);

    setLoading(true);

    try {
      const res = await axios.post(
        'https://email-marketting-tool-1.onrender.com/send-emails',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const results = res.data?.results || [];
      console.log("🟢 Email Results:", results);

      setEmailResults([...results]);
      setDialogOpen(true);

      setSnackbarMessage('Emails sent successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setExcelFile(null);
      setImageFiles([]);
      setSubject('');
      setMessage('');
      if (excelInputRef.current) excelInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';

    } catch (err) {
      console.error("❌ Email Send Error:", err);
      setSnackbarMessage(err.response?.data?.message || 'Failed to send emails.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const totalSent = emailResults.filter(r => r.status === 'Sent').length;
  const totalFailed = emailResults.filter(r => r.status !== 'Sent').length;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 4, fontWeight: 700, color: '#3f51b5', fontSize: { xs: '1.8rem', sm: '2.5rem' } }}
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
              InputLabelProps={{ shrink: true }}
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
              InputLabelProps={{ shrink: true }}
              inputProps={{ multiple: true }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Email Subject"
              fullWidth
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Message
            </Typography>
            <ReactQuill
              value={message}
              onChange={setMessage}
              theme="snow"
              style={{ height: 200, backgroundColor: '#fafafa' }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ py: 1.5, fontWeight: 600 }}
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
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 1.2,
                  backgroundColor: '#e0e0e0',
                  borderRadius: 2,
                  color: '#333',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  letterSpacing: '0.3px',
                  textAlign: 'center',
                  minWidth: 240,
                }}
              >
                Please wait... email is sending
              </Box>
            </Box>
          )}

        </form>

        {/* Results Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={fullScreen}
        >
          <DialogTitle sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Email Delivery Results
            <IconButton
              onClick={() => setDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ px: { xs: 1, sm: 3 }, py: { xs: 1, sm: 2 } }}>
            {emailResults.length === 0 ? (
              <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                No delivery results found.
              </Typography>
            ) : (
              <>
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    px: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      color: 'green',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: { xs: '1rem', sm: '1.1rem' }
                    }}
                  >
                    <CheckCircleIcon />
                    Sent: {totalSent}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      color: 'red',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: { xs: '1rem', sm: '1.1rem' }
                    }}
                  >
                    <ErrorIcon />
                    Failed: {totalFailed}
                  </Typography>
                </Box>

                <Box sx={{ overflowX: 'auto' }}>
                  <Table
                    sx={{
                      borderCollapse: 'separate',
                      borderSpacing: '0 8px',
                      minWidth: 320
                    }}
                    size={fullScreen ? 'small' : 'medium'}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                          Email
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {emailResults.map((item) => (
                        <TableRow
                          key={item.email}
                          sx={{
                            backgroundColor: item.status === 'Sent' ? '#e8f5e9' : '#ffebee',
                            borderRadius: 2,
                            '&:last-child td, &:last-child th': { border: 0 },
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <TableCell
                            sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' } }}
                          >
                            {item.email}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: item.status === 'Sent' ? 'green' : 'red',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              fontSize: { xs: '0.85rem', sm: '1rem' }
                            }}
                          >
                            {item.status === 'Sent' ? (
                              <CheckCircleIcon fontSize="small" />
                            ) : (
                              <ErrorIcon fontSize="small" />
                            )}
                            {item.status}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionProps={{ style: { animationDuration: '600ms' } }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{
              width: '100%',
              fontWeight: 600,
              fontSize: '1rem',
              letterSpacing: '0.02em',
              borderRadius: 2,
              boxShadow: 3,
              animation: 'slideIn 0.6s ease-out'
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default UploadForm;
