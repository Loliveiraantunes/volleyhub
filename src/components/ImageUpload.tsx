import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import UploadIcon from '@mui/icons-material/CloudUpload';
import { useEffect, useRef, useState } from 'react';

interface ImageUploadProps {
  label?: string;
  existingImageUrl?: string | null;
  onFileChange: (file: File | null) => void;
  variant?: 'square' | 'circular';
}

export function ImageUpload({ label = 'Imagem', existingImageUrl, onFileChange, variant = 'square' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // revoke the object URL created for the local preview to avoid leaking memory
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    onFileChange(file);
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileChange(null);
  };

  const displayUrl = previewUrl ?? existingImageUrl ?? undefined;

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={displayUrl}
          variant={variant === 'circular' ? 'circular' : 'rounded'}
          sx={{ width: 72, height: 72 }}
        >
          {!displayUrl && <UploadIcon />}
        </Avatar>
        <Stack spacing={1}>
          <Button variant="outlined" size="small" onClick={() => inputRef.current?.click()}>
            Selecionar imagem
          </Button>
          {displayUrl && (
            <Button size="small" color="error" onClick={handleRemove}>
              Remover
            </Button>
          )}
        </Stack>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </Stack>
    </Box>
  );
}
