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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
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

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Validation Results
          </h2>

          {validationResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="mx-auto h-12 w-12 mb-2" />
              <p>
                No validation results yet. Upload a CSV file to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {validationResults.map((result, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-medium text-gray-800">
                      {result.originalFilename}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(result.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="font-medium text-gray-800">
                          {formatNumber(result.valid)} valid
                        </span>
                      </div>
                    </div>

                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="font-medium text-gray-800">
                          {formatNumber(result.disposable)} disposable
                        </span>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="font-medium text-gray-800">
                          {formatNumber(result.syntaxInvalid)} syntax invalid
                        </span>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="font-medium text-gray-800">
                          {formatNumber(result.dnsInvalid)} DNS invalid
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end space-x-4">
                    <a
                      href={`${apiUrl}/api/download/${result.reportFile}`}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      download
                    >
                      Download Full Report
                    </a>
                    <a
                      href={`${apiUrl}/api/download/${result.validEmailsFile}`}
                      className="text-sm text-green-600 hover:text-green-800 hover:underline"
                      download
                    >
                      Download Valid Emails
                    </a>
                    <a
                      href={`${apiUrl}/api/download/${result.invalidEmailsFile}`}
                      className="text-sm text-red-600 hover:text-red-800 hover:underline"
                      download
                    >
                      Download Invalid Emails
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
