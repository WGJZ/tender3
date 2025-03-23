import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'info' | 'warning' | 'error';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  detail,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning',
  onConfirm,
  onCancel
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: { width: '100%', maxWidth: 500, borderRadius: '10px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          {severity === 'warning' && <WarningIcon color="warning" />}
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2, pb: 2 }}>
        <Alert severity={severity} sx={{ mb: detail ? 2 : 0 }}>
          <AlertTitle>{message}</AlertTitle>
          {detail && <Typography variant="body2">{detail}</Typography>}
        </Alert>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color={severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'primary'}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog; 