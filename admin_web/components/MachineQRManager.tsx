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
  const [selectedToken, setSelectedToken] = useState<QRToken | null>(null);

  // Helper function to build QR URL from token
  const buildQRUrl = (token: QRToken): string => {
    if (token.url) return token.url;

    // Construct URL from token and base URL
    const baseUrl = process.env.NEXT_PUBLIC_USER_WEB_URL || "http://localhost:3000";
    return `${baseUrl}/order?mt=${token.token}`;
  };

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
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Use provided label or generate a default one
      const label = newTokenLabel.trim() || `QR-${Date.now()}`;
      const result = await generateMachineQRToken(machineId, label);
      setGeneratedQR(result);
      setNewTokenLabel("");
      setShowGenerateForm(false);
      setSuccess(`QR code generated successfully!`);

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

  const handleDownloadQR = (elementId: string, fileName: string) => {
    try {
      // Get the container element
      const container = document.getElementById(elementId);
      if (!container) {
        console.error("QR container not found:", elementId);
        return;
      }

      // Find the SVG element inside the container
      const svg = container.querySelector("svg");
      if (!svg) {
        console.error("SVG not found in container:", elementId);
        return;
      }

      // Get SVG dimensions
      const svgRect = svg.getBoundingClientRect();
      const width = svgRect.width || 200;
      const height = svgRect.height || 200;

      // Create canvas with proper dimensions
      const canvas = document.createElement("canvas");
      const scale = 2; // Higher resolution
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get canvas context");
        return;
      }

      // Scale for better quality
      ctx.scale(scale, scale);

      // Serialize SVG
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Fill white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            URL.revokeObjectURL(url);
          }
        }, "image/png");
      };

      img.onerror = (err) => {
        console.error("Image load error:", err);
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error("Download QR error:", error);
      alert("Failed to download QR code. Please try again.");
    }
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
                  onClick={() => handleDownloadQR("qr-code-svg", `${generatedQR.qrCode.machineId}-QR-${generatedQR.qrCode.label}.png`)}
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
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
              Label is optional. Leave empty for auto-generated label.
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                label="Label (Optional)"
                placeholder="e.g., Main QR, Backup QR"
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
          <Box display="flex" gap={2} mb={3}>
            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={handleGenerateToken}
              disabled={generating}
            >
              {generating ? <CircularProgress size={24} /> : "Quick Generate QR"}
            </Button>
            <Button
              startIcon={<Add />}
              variant="outlined"
              onClick={() => setShowGenerateForm(true)}
            >
              Generate with Label
            </Button>
          </Box>
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
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
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

                    {/* Show QR code if selected */}
                    {selectedToken?.tokenId === token.tokenId && token.isActive && (
                      <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                        <div id={`qr-token-${token.tokenId}`}>
                          <QRCode value={buildQRUrl(token)} size={150} />
                        </div>
                        <Button
                          startIcon={<Download />}
                          onClick={() => handleDownloadQR(`qr-token-${token.tokenId}`, `${machineId}-QR-${token.label}.png`)}
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1, width: "100%" }}
                        >
                          Download
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Box display="flex" gap={1}>
                    {token.isActive && (
                      <>
                        <IconButton
                          onClick={() => setSelectedToken(selectedToken?.tokenId === token.tokenId ? null : token)}
                          color="primary"
                          title={selectedToken?.tokenId === token.tokenId ? "Hide QR" : "View QR"}
                          size="small"
                        >
                          <QrCode />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRevokeToken(token.tokenId)}
                          color="error"
                          title="Revoke this QR code"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </Box>
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
