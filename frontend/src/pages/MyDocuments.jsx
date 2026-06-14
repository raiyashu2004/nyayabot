import React, { useState, useEffect, useRef } from "react";
import { FolderOpen, FileText, Download, Trash2, UploadCloud, Search, Loader } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function MyDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching docs:", error.message);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      // 1. Upload to Supabase Storage Bucket
      const fileExt = file.name.split('.').pop();
      // Generate a unique path: user_id/timestamp.ext
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('nyayabot_docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Calculate readable size
      let sizeStr = (file.size / 1024).toFixed(0) + " KB";
      if (file.size > 1024 * 1024) {
        sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      }

      // 3. Save metadata to Postgres DB
      const { error: dbError } = await supabase
        .from('documents')
        .insert([{
          user_id: user.id,
          file_name: file.name,
          file_type: fileExt.toUpperCase(),
          file_size: sizeStr,
          storage_path: filePath,
          status: "Uploaded"
        }]);

      if (dbError) throw dbError;

      // Success: Refresh list
      fetchDocuments();
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDelete = async (id, storagePath) => {
    try {
      // Delete from DB and return the deleted row
      const { data: deletedRows, error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .select();

      if (dbError) throw new Error("Database Deletion Error: " + dbError.message);
      
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error("Could not delete from database. Record might be missing or blocked by Security Policies.");
      }

      // Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('nyayabot_docs')
        .remove([storagePath]);
        
      if (storageError) throw new Error("Cloud Storage Deletion Error: " + storageError.message);

      fetchDocuments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownload = async (storagePath, fileName) => {
    try {
      // Use createSignedUrl instead of download() to prevent browser Blob corruption
      const { data, error } = await supabase.storage
        .from('nyayabot_docs')
        .createSignedUrl(storagePath, 60); // URL valid for 60 seconds
        
      if (error) throw new Error("Failed to generate download link: " + error.message);

      if (data?.signedUrl) {
        // Create an invisible anchor to force download the signed URL natively
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = fileName;
        a.target = '_blank'; // Fallback if browser doesn't force download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      alert("Error downloading document: " + err.message);
    }
  };

  const filteredDocs = documents.filter(d => d.file_name.toLowerCase().includes(search.toLowerCase()));

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", margin: "0 0 4px" }}>My Documents</h2>
          <p style={{ color: "#64748B", margin: 0 }}>Securely manage your uploaded legal files and analyses.</p>
        </div>
        <button onClick={handleUploadClick} disabled={uploading} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: uploading ? "#94A3B8" : "#1A1A1A", color: "#FFF", padding: "10px 20px", borderRadius: 8,
          fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", border: "none", transition: "all 0.2s"
        }}>
          {uploading ? <Loader size={18} className="spin" /> : <UploadCloud size={18} />} 
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          onChange={handleFileChange} 
          accept=".pdf,.doc,.docx,.txt"
        />
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, background: "#F8FAFC", padding: "10px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
          <Search size={18} color="#94A3B8" />
          <input 
            type="text" 
            placeholder="Search documents by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", flex: 1, fontSize: 14 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748B" }}>
            <Loader size={30} className="spin" style={{ margin: "0 auto 16px", color: "#D4AF37" }} />
            <p>Loading your documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
            <FolderOpen size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
            <p>No documents found. Upload a file to get started.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
                <th style={{ padding: "12px 16px", color: "#64748B", fontWeight: 600, fontSize: 13, textTransform: "uppercase" }}>Name</th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontWeight: 600, fontSize: 13, textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontWeight: 600, fontSize: 13, textTransform: "uppercase" }}>Size</th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontWeight: 600, fontSize: 13, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", color: "#64748B", fontWeight: 600, fontSize: 13, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }} className="table-row-hover">
                  <td style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ padding: 8, background: "rgba(212,175,55,0.1)", color: "#D4AF37", borderRadius: 8 }}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1E293B", fontSize: 14 }}>{doc.file_name}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>{doc.file_type} Document</div>
                    </div>
                  </td>
                  <td style={{ padding: "16px", fontSize: 14, color: "#475569" }}>{formatDate(doc.created_at)}</td>
                  <td style={{ padding: "16px", fontSize: 14, color: "#475569" }}>{doc.file_size}</td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ 
                      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: doc.status === "Analyzed" ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.1)",
                      color: doc.status === "Analyzed" ? "#10B981" : "#64748B"
                    }}>
                      {doc.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => handleDownload(doc.storage_path, doc.file_name)} style={{ background: "transparent", border: "none", color: "#3B82F6", cursor: "pointer", padding: 6, borderRadius: 6 }} className="icon-btn-hover" title="Download">
                        <Download size={18} />
                      </button>
                      <button onClick={() => handleDelete(doc.id, doc.storage_path)} style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer", padding: 6, borderRadius: 6 }} className="icon-btn-hover" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
