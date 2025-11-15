import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
  Paper,
} from "@mui/material";
import {
  QrCode,
  Download,
  Delete,
  Add,
  ContentCopy,
  Check,
} from "@mui/icons-material";
import {
  generateMachineQRToken,
  getMachineQRTokens,
  revokeMachineQRToken,
  QRToken,
  QRTokenGenerateResult,
} from "../services/machineQR";
import QRCode from "react-qr-code";

interface MachineQRManagerProps {
  open: boolean;
  onClose: () => void;
  machineId: string;
}

export default function MachineQRManager({
  open,
  onClose,
  machineId,
}: MachineQRManagerProps) {
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<QRToken[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [generating, setGenerating] = useState(false);

  const [generatedQR, setGeneratedQR] = useState<QRTokenGenerateResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (open && machineId) {
      loadTokens();
    }
  }, [open, machineId]);

  const loadTokens = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getMachineQRTokens(machineId);
      setTokens(result.tokens);
    } catch (err: any) {
      setError(err.message || "Failed to load QR tokens");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!newTokenLabel.trim()) {
      setError("Please enter a label for the QR code");
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await generateMachineQRToken(machineId, newTokenLabel.trim());
      setGeneratedQR(result);
      setNewTokenLabel("");
      setShowGenerateForm(false);
      setSuccess(`QR code "${result.qrCode.label}" generated successfully!`);

      // Reload tokens list
      await loadTokens();
    } catch (err: any) {
      setError(err.message || "Failed to generate QR token");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this QR code? It will stop working immediately.")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await revokeMachineQRToken(machineId, tokenId);
      setSuccess("QR code revoked successfully");
      await loadTokens();
    } catch (err: any) {
      setError(err.message || "Failed to revoke QR token");
    }
  };

  const handleDownloadQR = () => {
    if (!generatedQR) return;

    // Get the SVG element
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    // Convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${generatedQR.qrCode.machineId}-QR-${generatedQR.qrCode.label}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleCopyUrl = async () => {
    if (!generatedQR) return;

    try {
      await navigator.clipboard.writeText(generatedQR.qrCode.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      alert("Failed to copy URL");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <QrCode />
          <Typography variant="h6">QR Code Manager - {machineId}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Generated QR Code Display */}
        {generatedQR && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: "grey.50" }}>
            <Typography variant="h6" gutterBottom>
              New QR Code Generated
            </Typography>
            <Box display="flex" gap={3} alignItems="flex-start">
              <Box>
                <div id="qr-code-svg">
                  <QRCode value={generatedQR.qrCode.url} size={200} />
                </div>
                <Button
                  startIcon={<Download />}
                  onClick={handleDownloadQR}
                  variant="contained"
                  size="small"
                  sx={{ mt: 2, width: "100%" }}
                >
                  Download PNG
                </Button>
              </Box>

              <Box flex={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Label
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {generatedQR.qrCode.label}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  URL
                </Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    value={generatedQR.qrCode.url}
                    size="small"
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <IconButton onClick={handleCopyUrl} color={copiedUrl ? "success" : "default"}>
                    {copiedUrl ? <Check /> : <ContentCopy />}
                  </IconButton>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  Token ID: {generatedQR.qrCode.tokenId}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Generate New Token Form */}
        {showGenerateForm && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Generate New QR Code
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                label="Label (e.g., Main QR, Backup QR)"
                value={newTokenLabel}
                onChange={(e) => setNewTokenLabel(e.target.value)}
                size="small"
                fullWidth
                disabled={generating}
              />
              <Button
                variant="contained"
                onClick={handleGenerateToken}
                disabled={generating}
              >
                {generating ? <CircularProgress size={24} /> : "Generate"}
              </Button>
              <Button onClick={() => setShowGenerateForm(false)} disabled={generating}>
                Cancel
              </Button>
            </Box>
          </Paper>
        )}

        {!showGenerateForm && (
          <Button
            startIcon={<Add />}
            variant="outlined"
            onClick={() => setShowGenerateForm(true)}
            sx={{ mb: 3 }}
          >
            Generate New QR Code
          </Button>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Existing Tokens List */}
        <Typography variant="h6" gutterBottom>
          Existing QR Codes ({tokens.length})
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : tokens.length === 0 ? (
          <Alert severity="info">
            No QR codes generated yet. Create one to get started!
          </Alert>
        ) : (
          <Box>
            {tokens.map((token) => (
              <Paper
                key={token.tokenId}
                elevation={1}
                sx={{ p: 2, mb: 2, opacity: token.isActive ? 1 : 0.6 }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">{token.label}</Typography>
                      <Chip
                        label={token.status}
                        color={token.status === "ACTIVE" ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(token.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Token ID: {token.tokenId}
                    </Typography>
                  </Box>

                  {token.isActive && (
                    <IconButton
                      onClick={() => handleRevokeToken(token.tokenId)}
                      color="error"
                      title="Revoke this QR code"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
