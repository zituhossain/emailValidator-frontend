"use client";
import { useState } from "react";
import axios from "axios";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
} from "lucide-react";

export default function EmailValidator() {
  const [file, setFile] = useState(null);
  const [emailColumn, setEmailColumn] = useState("emailColumn");
  const [validationResults, setValidationResults] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file && !emailColumn) {
      alert("Please select a file or enter an email column");
      return;
    }
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    if (file) {
      formData.append("csvFile", file);
    }
    formData.append("emailColumn", emailColumn);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });
      pollForResults(response.data.fileName, response.data.jobId);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
    }
  };

  const pollForResults = async (fileName, recordId) => {
    try {
      const response = await axios.get(`${apiUrl}/results/${recordId}`);

      if (response.data.status === "completed") {
        setValidationResults([response.data, ...validationResults]);
        setIsUploading(false);
        setProgress(100);
      } else {
        setTimeout(() => {
          pollForResults(fileName, recordId);
        }, 5000); // Poll every 5 seconds
      }
    } catch (error) {
      console.error("Error polling for results:", error);
      setIsUploading(false);
    }
  };

  const formatNumber = (number) => {
    if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}k`;
    }
    return number;
  };
}
