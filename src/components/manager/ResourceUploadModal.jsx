import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Upload, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResourceUploadModal({ onClose }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const queryClient = useQueryClient();

  const categories = [
    "Worksheets",
    "Guides",
    "Audio Sessions",
    "Videos",
    "Templates",
    "Graphics",
    "Tools",
    "Other"
  ];

  const getFileType = (file) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    
    if (type.includes("pdf")) return "pdf";
    if (type.includes("video")) return "video";
    if (type.includes("audio")) return "audio";
    if (type.includes("image") || name.endsWith('.svg')) return "image";
    if (type.includes("text") || name.endsWith('.txt')) return "text";
    return "worksheet"; // Default for documents and other files
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const fileObjects = selectedFiles.map(file => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      description: "",
      category: "Other",
      resource_type: getFileType(file),
      status: "pending"
    }));
    setFiles(fileObjects);
  };

  const updateFileData = (index, field, value) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const handleUpload = async () => {
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      const fileData = files[i];
      
      try {
        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file: fileData.file });
        
        // Create resource record
        const fileSizeInMB = (fileData.file.size / 1024 / 1024).toFixed(2);
        await base44.entities.Resource.create({
          title: fileData.title,
          description: fileData.description,
          category: fileData.category,
          resource_type: fileData.resource_type,
          file_url: file_url,
          file_size: `${fileSizeInMB} MB`,
          access_level: "public",
          status: "published"
        });
        
        setUploadedFiles(prev => [...prev, i]);
        updateFileData(i, "status", "success");
      } catch (error) {
        updateFileData(i, "status", "error");
        updateFileData(i, "error", error.message);
      }
    }
    
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["resources"] });
    
    // If all successful, close modal
    if (files.every(f => f.status === "success")) {
      setTimeout(() => onClose(), 1000);
    }
  };

  const allFilesConfigured = files.every(f => f.title && f.category);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-6 flex items-start justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg max-w-3xl w-full p-8 my-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-2xl text-[#1E3A32]">Upload Resources</h2>
            <button onClick={onClose} className="text-[#2B2725]/40 hover:text-[#2B2725]">
              <X size={24} />
            </button>
          </div>

          {files.length === 0 ? (
            <div className="border-2 border-dashed border-[#E4D9C4] rounded-lg p-12 text-center">
              <Upload size={48} className="mx-auto text-[#D8B46B] mb-4" />
              <h3 className="font-medium text-[#1E3A32] mb-2">Select Files to Upload</h3>
              <p className="text-sm text-[#2B2725]/60 mb-6">
                PDFs, images, videos, audio files, and documents
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" asChild>
                  <span>Choose Files</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File List */}
              <div className="max-h-[400px] overflow-y-auto space-y-4">
                {files.map((fileData, index) => (
                  <div key={index} className="p-4 bg-[#F9F5EF] rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0">
                        {uploading && index === currentFileIndex && fileData.status === "pending" && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E3A32]"></div>
                        )}
                        {fileData.status === "success" && (
                          <div className="p-1 bg-green-100 rounded-full">
                            <Check size={16} className="text-green-600" />
                          </div>
                        )}
                        {fileData.status === "error" && (
                          <div className="p-1 bg-red-100 rounded-full">
                            <AlertCircle size={16} className="text-red-600" />
                          </div>
                        )}
                        {fileData.status === "pending" && !uploading && (
                          <div className="p-1 bg-[#D8B46B]/20 rounded-full">
                            <Upload size={16} className="text-[#D8B46B]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#1E3A32] text-sm">
                          {fileData.file.name}
                        </p>
                        <p className="text-xs text-[#2B2725]/60">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB • {fileData.resource_type}
                        </p>
                      </div>
                      {!uploading && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>

                    {fileData.status === "error" && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        Error: {fileData.error}
                      </div>
                    )}

                    {fileData.status !== "success" && !uploading && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Title *</Label>
                          <Input
                            value={fileData.title}
                            onChange={(e) => updateFileData(index, "title", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={fileData.description}
                            onChange={(e) => updateFileData(index, "description", e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category *</Label>
                          <Select
                            value={fileData.category}
                            onValueChange={(value) => updateFileData(index, "category", value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  {uploading && (
                    <p className="text-sm text-[#2B2725]/70">
                      Uploading {currentFileIndex + 1} of {files.length}...
                    </p>
                  )}
                  {!uploading && uploadedFiles.length > 0 && (
                    <p className="text-sm text-green-700">
                      {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} uploaded successfully
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} disabled={uploading}>
                    {uploadedFiles.length > 0 ? "Close" : "Cancel"}
                  </Button>
                  {!uploading && files.some(f => f.status !== "success") && (
                    <Button
                      onClick={handleUpload}
                      disabled={!allFilesConfigured}
                      className="bg-[#1E3A32] hover:bg-[#2B2725]"
                    >
                      Upload {files.filter(f => f.status !== "success").length} File{files.filter(f => f.status !== "success").length > 1 ? "s" : ""}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}