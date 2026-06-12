"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/services/firebase/config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp
} from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import PhoneLogin from "@/components/features/auth/PhoneLogin";
import { 
  ChevronUp, 
  MessageSquarePlus, 
  Search, 
  Filter, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  RefreshCw 
} from "lucide-react";

interface PluginRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "proposed" | "in-development" | "completed";
  votes: number;
  votedUids: string[];
  approved: boolean;
  createdAt: unknown;
}

interface PluginRequestBoardProps {
  onClose?: () => void;
}

export default function PluginRequestBoard({ onClose }: PluginRequestBoardProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PluginRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("OCR");
  const [submitting, setSubmitting] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "proposed" | "in-development" | "completed">("all");

  const categories = ["OCR", "Image Processing", "PDF Utilities", "Sheets / CSV", "Docs & Text", "General"];

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch only approved requests for public view
      const q = query(
        collection(db, "pluginRequests"),
        where("approved", "==", true),
        orderBy("votes", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetched: PluginRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          category: data.category,
          status: data.status,
          votes: data.votes || 0,
          votedUids: data.votedUids || [],
          approved: data.approved,
          createdAt: data.createdAt,
        });
      });
      setRequests(fetched);
    } catch (err) {
      console.error("Error fetching plugin requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchRequests();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleUpvote = async (requestId: string, votedUids: string[]) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const requestDocRef = doc(db, "pluginRequests", requestId);
    const hasVoted = votedUids.includes(user.uid);

    try {
      if (hasVoted) {
        // Remove vote
        await updateDoc(requestDocRef, {
          votes: Math.max(0, (requests.find(r => r.id === requestId)?.votes || 1) - 1),
          votedUids: arrayRemove(user.uid)
        });
      } else {
        // Add vote
        await updateDoc(requestDocRef, {
          votes: (requests.find(r => r.id === requestId)?.votes || 0) + 1,
          votedUids: arrayUnion(user.uid)
        });
      }
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error("Upvoting failed:", err);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!newTitle.trim() || !newDescription.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "pluginRequests"), {
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        status: "proposed",
        votes: 1,
        votedUids: [user.uid],
        approved: false, // Needs admin approval to prevent spam
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });

      setNewTitle("");
      setNewDescription("");
      setShowAddDrawer(false);
      alert("Your request was submitted! It will appear on the board once approved by the admin.");
    } catch (err) {
      console.error("Failed to add request:", err);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search computation
  const filteredRequests = requests.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <span>Plugin Request Portal</span>
              <span className="text-[10px] bg-accent-blue/15 text-accent-blue px-2 py-0.5 rounded-full font-bold font-mono uppercase">
                Community Board
              </span>
            </h1>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-surface-variant/40 md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-xl">
            Vote on proposed plugins or suggest your own. Help us shape the ultimate local-first offline workspace utilities.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          {onClose && (
            <Button
              variant="secondary"
              onClick={onClose}
              className="h-12 px-5 hidden md:flex items-center gap-2"
            >
              Close Feed
            </Button>
          )}

        <Button 
          variant="primary" 
          onClick={() => {
            if (!user) setShowAuthModal(true);
            else setShowAddDrawer(true);
          }}
          className="h-12 flex items-center gap-2 shadow-sm shrink-0"
        >
          <MessageSquarePlus className="w-5 h-5 stroke-[1.5px]" />
          <span>Request a Plugin</span>
        </Button>
      </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
            <Search className="w-5 h-5 stroke-[1.5px]" />
          </span>
          <input
            type="text"
            placeholder="Search suggested plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-bg-surface text-text-primary placeholder:text-text-muted/50 border border-border-subtle/10 rounded-pill focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:bg-bg-surface transition-all duration-280 shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider px-2 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status</span>
          </span>
          {(
            [
              { id: "all", label: "All" },
              { id: "proposed", label: "Proposed" },
              { id: "in-development", label: "In Dev" },
              { id: "completed", label: "Completed" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`h-9 px-4 rounded-pill text-xs font-medium transition-all duration-280 shrink-0 ${
                selectedStatus === tab.id
                  ? "bg-bg-surface-variant text-text-primary border border-border-subtle/20"
                  : "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface-variant/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <RefreshCw className="w-8 h-8 animate-spin text-accent-blue mb-4 stroke-[1.5px]" />
          <p className="text-xs uppercase font-mono tracking-wider">Retrieving Suggestions</p>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((request) => {
            const hasVoted = user && request.votedUids.includes(user.uid);
            return (
              <div 
                key={request.id}
                className="flex items-start gap-5 p-6 rounded-container bg-bg-surface border border-border-subtle/10 shadow-soft_elevation hover:border-border-subtle/30 transition-all duration-280"
              >
                {/* Vote Button Block */}
                <button
                  onClick={() => handleUpvote(request.id, request.votedUids)}
                  className={`flex flex-col items-center justify-center w-12 h-14 rounded-interactive border transition-all duration-280 shrink-0 ${
                    hasVoted
                      ? "bg-accent-blue/15 border-accent-blue/30 text-accent-blue"
                      : "bg-bg-surface-variant/50 border-border-subtle/10 hover:border-border-subtle/30 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <ChevronUp className="w-5 h-5 stroke-[2.5px]" />
                  <span className="text-xs font-mono font-bold mt-1">
                    {request.votes}
                  </span>
                </button>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[10px] bg-bg-surface-variant px-2.5 py-1 rounded-pill font-semibold text-text-secondary">
                      {request.category}
                    </span>

                    {/* Status badges */}
                    {request.status === "completed" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/15">
                        <CheckCircle2 className="w-3 h-3 stroke-[2.5px]" />
                        <span>Completed</span>
                      </span>
                    )}
                    {request.status === "in-development" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-yellow-500/15">
                        <Clock className="w-3 h-3 stroke-[2.5px]" />
                        <span>In Development</span>
                      </span>
                    )}
                    {request.status === "proposed" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-500/15">
                        <Sparkles className="w-3 h-3 stroke-[2.5px]" />
                        <span>Proposed</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-text-primary mt-2">
                    {request.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                    {request.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border-subtle/25 rounded-container bg-bg-surface-variant/10">
          <TrendingUp className="w-8 h-8 text-text-muted/60 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-text-primary">No suggestions match your query</h3>
          <p className="text-xs text-text-secondary mt-1">
            Be the first to submit a plugin request! Click &quot;Request a Plugin&quot; above.
          </p>
        </div>
      )}

      {/* Drawer: Add plugin request */}
      {showAddDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-bg-surface h-full shadow-lg p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-280">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle/10 mb-6">
                <h2 className="text-lg font-bold text-text-primary">Submit a Plugin Request</h2>
                <button 
                  onClick={() => setShowAddDrawer(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-surface-variant/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-6">
                <TextField
                  label="Title of the Plugin"
                  placeholder="e.g. HEIC image converter to PNG"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                  required
                  disabled={submitting}
                />

                <div>
                  <label className="block text-xs font-semibold text-text-secondary pl-3 mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-12 px-4 bg-bg-surface-variant text-text-primary border border-transparent rounded-pill focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:bg-bg-surface text-sm transition-all duration-280"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary pl-3 mb-1.5">
                    Describe what it should do
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide details on format support, input/output requirements, and potential use cases."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full p-4 bg-bg-surface-variant text-text-primary placeholder:text-text-muted/50 border border-transparent rounded-interactive focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:bg-bg-surface text-sm transition-all duration-280"
                    required
                    disabled={submitting}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !newTitle.trim() || !newDescription.trim()}
                  className="w-full h-12"
                >
                  {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Submit Request"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-bg-surface rounded-container p-1 border border-border-subtle/10">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 z-10 p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-surface-variant"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="pt-8">
              <PhoneLogin onSuccess={() => setShowAuthModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
