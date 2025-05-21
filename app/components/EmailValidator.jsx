"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
} from "lucide-react";
import ResultsList from "./ResultList";

export default function EmailValidator() {
  const [file, setFile] = useState(null);
  const [emailColumn, setEmailColumn] = useState("");
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
      pollForResults(response.data.fileName, response.data.recordId);
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

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`${apiUrl}/results`);
        const data = await response.json();
        if (data && Array.isArray(data.dbResults)) {
          // Normalize csvPath slashes and extract just the filename for download
          const processed = data.dbResults.map((result) => {
            const csvFilename = result.csvPath.split("\\").pop();
            return {
              ...result,
              csvPath: csvFilename, // For download links
            };
          });
          setValidationResults(processed);
        }
      } catch (error) {
        console.error("Failed to fetch validation results:", error);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Email Validator
        </h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CSV File
              </label>
              <div className="flex-1">
                <label className="cursor-pointer block">
                  <div className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                    {file ? (
                      <div className="flex items-center text-blue-600">
                        <FileText className="mr-2" />
                        <span>{file.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <Upload className="mr-2" />
                        <span>Choose a file</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Column Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                value={emailColumn}
                onChange={(e) => {
                  console.log("Typed:", e.target.value);
                  setEmailColumn(e.target.value);
                }}
                placeholder="Enter email column name"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-blue-300 transition-colors flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <span className="mr-2">Processing... {progress}%</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                "Validate Emails"
              )}
            </button>
          </form>
        </div>

        <ResultsList validationResults={validationResults} apiUrl={apiUrl} />
      </div>
    </div>
  );
}
