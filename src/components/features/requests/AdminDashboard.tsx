"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/services/firebase/config";
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Trash2, Clock, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";

  interface PluginRequest {
    id: string;
    title: string;
    description: string;
    category: string;
    status: "proposed" | "in-development" | "completed";
    votes: number;
    approved: boolean;
    createdAt: unknown;
  }

  export default function AdminDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<PluginRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAllRequests = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "pluginRequests"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetched: PluginRequest[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          fetched.push({
            id: docSnapshot.id,
            title: data.title,
            description: data.description,
            category: data.category,
            status: data.status,
            votes: data.votes || 0,
            approved: data.approved || false,
            createdAt: data.createdAt,
          });
        });
        setRequests(fetched);
      } catch (err) {
        console.error("Error fetching requests for admin:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      let active = true;
      const load = async () => {
        await Promise.resolve();
        if (active) {
          fetchAllRequests();
        }
      };
      load();
      return () => {
        active = false;
      };
    }, [user]);

  const toggleApproval = async (requestId: string, currentApproved: boolean) => {
    try {
      const requestDocRef = doc(db, "pluginRequests", requestId);
      await updateDoc(requestDocRef, {
        approved: !currentApproved
      });
      fetchAllRequests();
    } catch (err) {
      console.error("Approval change failed:", err);
    }
  };

  const updateStatus = async (requestId: string, status: "proposed" | "in-development" | "completed") => {
    try {
      const requestDocRef = doc(db, "pluginRequests", requestId);
      await updateDoc(requestDocRef, {
        status
      });
      fetchAllRequests();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this request permanently?")) return;
    try {
      const requestDocRef = doc(db, "pluginRequests", requestId);
      await deleteDoc(requestDocRef);
      fetchAllRequests();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-yellow-500 mb-4 stroke-[1.5px]" />
        <h2 className="text-lg font-bold text-text-primary">Admin Access Restricted</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
          Please log in on the main board page first to access the administration dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between pb-6 border-b border-border-subtle/10 mb-8">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <span>Admin Moderation Console</span>
            <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-mono font-bold uppercase border border-red-500/15">
              Secure
            </span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Review suggested plugin submissions, toggle public visibility, and update delivery milestones.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchAllRequests} className="h-10 text-xs px-4">
          Refresh List
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-muted">Retrieving all requests...</div>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((request) => (
            <div 
              key={request.id}
              className="p-5 rounded-container bg-bg-surface border border-border-subtle/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-bg-surface-variant px-2 py-0.5 rounded text-text-secondary uppercase tracking-wider font-semibold">
                    {request.category}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    request.approved 
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15" 
                      : "text-red-400 bg-red-500/10 border border-red-500/15"
                  }`}>
                    {request.approved ? "Approved (Public)" : "Pending (Hidden)"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-text-primary mt-2">{request.title}</h3>
                <p className="text-xs text-text-secondary mt-1">{request.description}</p>
                <div className="text-[10px] text-text-muted mt-2 font-mono">
                  Votes: {request.votes}
                </div>
              </div>

              {/* Moderation Controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Approve/Reject Toggle */}
                <Button
                  variant={request.approved ? "secondary" : "primary"}
                  onClick={() => toggleApproval(request.id, request.approved)}
                  className="h-9 px-3.5 text-xs rounded-pill"
                >
                  {request.approved ? "Hide" : "Approve"}
                </Button>

                {/* Status cycle buttons */}
                <div className="flex items-center bg-bg-surface-variant p-1 rounded-pill">
                  <button
                    onClick={() => updateStatus(request.id, "proposed")}
                    title="Mark Proposed"
                    className={`p-1.5 rounded-full ${request.status === "proposed" ? "bg-accent-blue text-white" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateStatus(request.id, "in-development")}
                    title="Mark In Dev"
                    className={`p-1.5 rounded-full ${request.status === "in-development" ? "bg-accent-blue text-white" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateStatus(request.id, "completed")}
                    title="Mark Completed"
                    className={`p-1.5 rounded-full ${request.status === "completed" ? "bg-accent-blue text-white" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteRequest(request.id)}
                  className="p-2 text-text-muted hover:text-red-400 hover:bg-bg-surface-variant/40 rounded-full"
                >
                  <Trash2 className="w-4 h-4 stroke-[1.5px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-text-muted">No requests submitted yet.</div>
      )}
    </div>
  );
}
