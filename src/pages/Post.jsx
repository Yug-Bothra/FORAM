import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../supabaseClient";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import getCroppedImg from "../utils/cropImage";
import { Camera, Video, Image, Globe, Lock, X, Crop, Upload, Sparkles, CheckCircle, Zap, Heart } from "lucide-react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const Post = () => {
  const { user } = useUser();

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("image");

  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [imageRef, setImageRef] = useState();
  const [imagePreview, setImagePreview] = useState("");

  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setVideoFile(null);

      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setImageFile(null);
      setShowCrop(false);
      setImagePreview("");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (activeTab === "image" && file.type.startsWith("image/")) {
        setImageFile(file);
        setVideoFile(null);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else if (activeTab === "video" && file.type.startsWith("video/")) {
        setVideoFile(file);
        setImageFile(null);
        setShowCrop(false);
        setImagePreview("");
      }
    }
  };

  const handleShowCrop = () => {
    if (imageFile && imagePreview) {
      setShowCrop(true);
      setCrop({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
    }
  };

  const handleApplyCrop = async () => {
    if (completedCrop && imageRef) {
      const croppedBlob = await getCroppedImg(imagePreview, completedCrop);
      const croppedFile = new File([croppedBlob], imageFile.name, {
        type: imageFile.type,
      });
      setImageFile(croppedFile);
      setShowCrop(false);
    }
  };

  const handleUpload = async (file, type) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const endpoint =
      type === "video"
        ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`
        : `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    // Simulate upload progress for UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    const res = await fetch(endpoint, { method: "POST", body: formData });
    clearInterval(progressInterval);
    setUploadProgress(100);
    
    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    return { type, url: data.secure_url };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to post");
    setLoading(true);
    setUploadProgress(0);

    try {
      let attachment = null;
      if (imageFile) attachment = await handleUpload(imageFile, "image");
      else if (videoFile) attachment = await handleUpload(videoFile, "video");

      const { error } = await supabase.from("posts").insert([
        {
          user_id: user.id,
          content: content.trim(),
          visibility: isPublic ? "public" : "private",
          attachments: attachment ? [attachment] : null,
        },
      ]);

      if (error) throw error;

      setContent("");
      setImageFile(null);
      setVideoFile(null);
      setImagePreview("");
      setIsPublic(true);
      setUploadProgress(0);
      
      // Success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (err) {
      alert("Error creating post: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Success Toast */}
      {showSuccess && (
        <div className="fixed top-8 right-8 z-50 transform animate-bounce">
          <div className="bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center space-x-3 border-2 border-white/20 dark:border-gray-800/20">
            <div className="w-8 h-8 bg-white/20 dark:bg-gray-800/20 rounded-full flex items-center justify-center animate-pulse">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <p className="font-bold text-lg">Post Created! 🚀</p>
              <p className="text-white/90 text-sm">Your masterpiece is now live</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Container with Glass Effect */}
      <div className="max-w-3xl mx-auto p-10 relative">
        {/* Animated Background Blobs */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-[#6C63FF]/20 to-[#FF6584]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-gradient-to-r from-[#FF6584]/20 to-[#6C63FF]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div 
          className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden transition-all duration-500 hover:shadow-3xl"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Animated Header Gradient */}
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#6C63FF] via-[#FF6584] to-[#6C63FF] animate-gradient-x"></div>
          
          {/* Header Section */}
          <div className="p-8 pb-0">
            <div className="flex items-center space-x-4 mb-8">
              <div className={`relative w-16 h-16 bg-gradient-to-br from-[#6C63FF] to-[#FF6584] rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${isHovering ? 'scale-110 rotate-6' : ''}`}>
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
                <div className="absolute -inset-1 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-2xl blur opacity-30 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-[#6C63FF] to-[#FF6584] bg-clip-text text-transparent">
                  Create Magic ✨
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Share your story with the universe</p>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 space-y-8">
            {/* Content Textarea */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-3xl opacity-20 group-focus-within:opacity-40 transition-opacity duration-300 blur"></div>
              <textarea
                className="relative w-full p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-[#6C63FF]/20 transition-all duration-300 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 resize-none bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm text-lg leading-relaxed font-medium shadow-inner"
                rows="6"
                placeholder="What's inspiring you today? Share your thoughts, dreams, and wild ideas..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                maxLength={500}
              />
              <div className="absolute bottom-4 right-6 flex items-center space-x-2">
                <div className={`text-sm font-semibold ${content.length > 400 ? 'text-[#FF6584]' : 'text-gray-500 dark:text-gray-400'}`}>
                  {content.length}/500
                </div>
                <Zap className="w-4 h-4 text-[#6C63FF]" />
              </div>
            </div>

            {/* Enhanced Media Tabs */}
            <div className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-white dark:to-gray-900 rounded-2xl p-3 border border-gray-200 dark:border-gray-700 shadow-inner">
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "image"
                      ? "bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white shadow-xl shadow-[#6C63FF]/25"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/70 hover:shadow-lg"
                  }`}
                  onClick={() => setActiveTab("image")}
                >
                  <Camera className="w-6 h-6" />
                  <span>Images</span>
                  {activeTab === "image" && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                </button>
                <button
                  type="button"
                  className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "video"
                      ? "bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white shadow-xl shadow-[#6C63FF]/25"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/70 hover:shadow-lg"
                  }`}
                  onClick={() => setActiveTab("video")}
                >
                  <Video className="w-6 h-6" />
                  <span>Videos</span>
                  {activeTab === "video" && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                </button>
              </div>
            </div>

            {/* Image Upload Section */}
            {activeTab === "image" && (
              <div className="space-y-6">
                <div 
                  className={`group relative p-12 border-3 border-dashed rounded-3xl transition-all duration-500 cursor-pointer transform hover:scale-105 ${
                    dragActive 
                      ? "border-[#6C63FF] bg-gradient-to-br from-[#6C63FF]/10 to-[#FF6584]/10 scale-105 shadow-2xl" 
                      : "border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 dark:from-gray-800 to-white dark:to-gray-900 hover:border-[#6C63FF]/50 hover:shadow-xl"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  {/* Upload Icon with Animation */}
                  <div className="text-center relative">
                    <div className="relative mx-auto mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#6C63FF] to-[#FF6584] rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <Image className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute -inset-2 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-3xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200 group-hover:text-[#6C63FF] transition-colors duration-300">
                        {dragActive ? "🎯 Drop it like it's hot!" : "📸 Click or Drop Your Image"}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                        JPG, PNG, WebP • Up to 10MB • Make it beautiful!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {imageFile && (
                  <div className="bg-gradient-to-r from-white dark:from-gray-800 to-gray-50 dark:to-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-2xl flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h4 className="font-black text-xl text-gray-800 dark:text-gray-200">{imageFile.name}</h4>
                          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB • Ready to rock!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                        className="p-3 text-[#FF6584] hover:bg-[#FF6584]/10 rounded-2xl transition-all duration-200 transform hover:scale-110"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    {imagePreview && (
                      <div className="space-y-6">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                          <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        </div>
                        <button
                          type="button"
                          onClick={handleShowCrop}
                          className="flex items-center justify-center space-x-3 w-full py-4 px-6 text-white bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-2xl hover:shadow-xl transition-all duration-300 font-bold text-lg transform hover:scale-105"
                        >
                          <Crop className="w-6 h-6" />
                          <span>Perfect Your Crop ✂️</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Video Upload Section */}
            {activeTab === "video" && (
              <div className="space-y-6">
                <div 
                  className={`group relative p-12 border-3 border-dashed rounded-3xl transition-all duration-500 cursor-pointer transform hover:scale-105 ${
                    dragActive 
                      ? "border-[#6C63FF] bg-gradient-to-br from-[#6C63FF]/10 to-[#FF6584]/10 scale-105 shadow-2xl" 
                      : "border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 dark:from-gray-800 to-white dark:to-gray-900 hover:border-[#6C63FF]/50 hover:shadow-xl"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  <div className="text-center relative">
                    <div className="relative mx-auto mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#6C63FF] to-[#FF6584] rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <Video className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute -inset-2 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-3xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200 group-hover:text-[#6C63FF] transition-colors duration-300">
                        {dragActive ? "🎬 Action! Drop your video!" : "🎥 Upload Your Masterpiece"}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                        MP4, MOV, AVI • Up to 100MB • Lights, camera, action!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Preview */}
                {videoFile && (
                  <div className="bg-gradient-to-r from-white dark:from-gray-800 to-gray-50 dark:to-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-2xl flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h4 className="font-black text-xl text-gray-800 dark:text-gray-200">{videoFile.name}</h4>
                          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                            {(videoFile.size / 1024 / 1024).toFixed(2)} MB • Video magic ready!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideoFile(null)}
                        className="p-3 text-[#FF6584] hover:bg-[#FF6584]/10 rounded-2xl transition-all duration-200 transform hover:scale-110"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer with Visibility & Submit */}
            <div className="flex items-center justify-between pt-8 border-t-2 border-gray-200 dark:border-gray-700">
              {/* Enhanced Visibility Toggle */}
              <div className="flex items-center space-x-6">
                <div
                  onClick={() => setIsPublic(!isPublic)}
                  className="flex items-center space-x-4 cursor-pointer select-none group"
                >
                  <div className="relative">
                    <div
                      className={`w-20 h-10 rounded-full p-1 transition-all duration-500 shadow-lg ${
                        isPublic 
                          ? "bg-gradient-to-r from-[#6C63FF] to-[#FF6584]" 
                          : "bg-gradient-to-r from-gray-200 dark:from-gray-600 to-gray-300 dark:to-gray-500"
                      }`}
                    >
                      <div
                        className={`bg-white dark:bg-gray-900 w-8 h-8 rounded-full shadow-xl flex items-center justify-center transform transition-all duration-500 ${
                          isPublic ? "translate-x-10" : "translate-x-0"
                        } group-hover:scale-110`}
                      >
                        {isPublic ? (
                          <Globe className="w-4 h-4 text-[#6C63FF]" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                    </div>
                    {isPublic && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-full opacity-30 blur animate-pulse"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-xl text-gray-800 dark:text-gray-200">
                      {isPublic ? "🌍 Public" : "🔒 Private"}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                      {isPublic ? "Share with the world!" : "Just for you"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Epic Submit Button */}
              <div className="relative">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`relative overflow-hidden px-10 py-5 rounded-2xl font-black text-xl text-white transition-all duration-500 transform hover:scale-110 disabled:scale-100 shadow-2xl group ${
                    loading
                      ? "bg-gradient-to-r from-[#A8A2FF] to-[#FF6584]/70 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#6C63FF] to-[#FF6584] hover:shadow-3xl active:scale-95"
                  }`}
                >
                  {/* Button Background Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF6584] to-[#6C63FF] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Button Content */}
                  <div className="relative flex items-center space-x-3">
                    {loading ? (
                      <>
                        <Upload className="w-6 h-6 animate-bounce" />
                        <span>Publishing Magic...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 group-hover:animate-spin" />
                        <span>🚀 Launch Post</span>
                        <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
                      </>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {loading && uploadProgress > 0 && (
                    <div className="absolute bottom-0 left-0 h-2 bg-white/20 dark:bg-gray-800/20 rounded-full overflow-hidden w-full">
                      <div 
                        className="h-full bg-gradient-to-r from-white to-white/70 transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Glow Effect */}
                  {!loading && (
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-2xl blur opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra Enhanced Crop Modal */}
      {showCrop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-auto shadow-2xl border-4 border-white/20 dark:border-gray-700/20 relative">
            {/* Animated Header */}
            <div className="relative p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#6C63FF]/5 via-[#FF6584]/5 to-[#6C63FF]/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] opacity-10 animate-pulse"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#6C63FF] to-[#FF6584] rounded-2xl flex items-center justify-center shadow-xl">
                    <Crop className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-[#6C63FF] to-[#FF6584] bg-clip-text text-transparent">
                      ✂️ Perfect Your Shot
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Make every pixel count!</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCrop(false)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all duration-200 transform hover:scale-110 hover:rotate-90"
                >
                  <X className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Crop Area */}
            <div className="p-8">
              <div className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-white dark:to-gray-900 rounded-3xl p-8 border-2 border-gray-200 dark:border-gray-700 shadow-inner">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined}
                  minWidth={50}
                  minHeight={50}
                  className="rounded-2xl overflow-hidden shadow-2xl"
                >
                  <img
                    ref={(ref) => setImageRef(ref)}
                    alt="Crop me"
                    src={imagePreview}
                    className="max-w-full h-auto rounded-2xl"
                  />
                </ReactCrop>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="p-8 border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-white dark:to-gray-900 rounded-b-3xl">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCrop(false)}
                  className="px-8 py-4 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-200 font-bold text-lg transform hover:scale-105"
                >
                  Skip Crop
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="px-8 py-4 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white rounded-2xl hover:shadow-2xl transition-all duration-200 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 relative overflow-hidden group"
                  disabled={!completedCrop}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF6584] to-[#6C63FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Apply Perfect Crop</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </>
  );
};

export default Post;