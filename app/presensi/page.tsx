"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowPathIcon, CheckCircleIcon, MapPinIcon } from "@heroicons/react/24/solid";

export default function PresensiPage() {
  const [name, setName] = useState("");
  const [outlet, setOutlet] = useState(""); // ✅ Tambahan
  const [hasilKunjungan, setHasilKunjungan] = useState("");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [coords, setCoords] = useState<{ lat: number; long: number } | null>(
    null
  );
  const [address, setAddress] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    startCamera();
    getLocationWithAddress();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch {
      setError("❌ Tidak dapat membuka kamera. Izinkan akses kamera.");
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPhotoBlob(blob);
          setPreview(URL.createObjectURL(blob));
        }
      },
      "image/jpeg",
      0.95
    );
  };

  const getLocationWithAddress = () => {
    setIsRefreshing(true);
    setRefreshStatus("loading");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const long = pos.coords.longitude;

        setCoords({ lat, long });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${long}&format=json`
          );
          const data = await res.json();
          setAddress(data.display_name || "Alamat tidak ditemukan");

          setRefreshStatus("success");
          setTimeout(() => {
            setRefreshStatus("idle");
            setIsRefreshing(false);
          }, 1500);
        } catch {
          setAddress("Gagal mengambil alamat");
          setRefreshStatus("error");
          setTimeout(() => {
            setRefreshStatus("idle");
            setIsRefreshing(false);
          }, 1500);
        }
      },
      () => {
        setError("❌ Izinkan lokasi & aktifkan GPS (Presisi Tinggi).");
        setRefreshStatus("error");
        setTimeout(() => {
          setRefreshStatus("idle");
          setIsRefreshing(false);
        }, 1500);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async () => {
    if (!name || !outlet || !photoBlob || !coords || !address) {
      setError(
        "❌ Nama, outlet, foto, lokasi, dan alamat wajib diisi!"
      );
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const fileName = `${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("presensi-foto")
        .upload(fileName, photoBlob);

      if (uploadError) throw new Error("Gagal upload foto");

      const photo_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/presensi-foto/${fileName}`;

      const { error: insertError } = await supabase.from("presensi").insert({
        name,
        outlet_name: outlet,
        kunjungan: hasilKunjungan, 
        photo_url,
        latitude: coords.lat,
        longitude: coords.long,
        address,
      });

      if (insertError) throw new Error("Gagal simpan data");

      alert("✅ Presensi berhasil!");
      setName("");
      setOutlet(""); // ✅ Reset outlet
      setPreview(null);
      setPhotoBlob(null);
      setCoords(null);
      setAddress("");
    } catch (err: any) {
      setError("❌ " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitHasilKunjungan = async () => {
    if (!hasilKunjungan) {
      alert("Hasil kunjungan harus diisi");
      return;
    }

    if (!coords || !address) {
      alert("Lokasi belum tersedia, silakan refresh lokasi");
      return;
    }

    const { error } = await supabase.from("kunjungan").insert({
      hasil: hasilKunjungan, 
      latitude: coords.lat,
      longitude: coords.long,
      address: address,
      created_at: new Date(),
    });

    if (error) {
      alert("❌ Gagal menyimpan hasil kunjungan");
    } else {
      alert("✅ Hasil kunjungan tersimpan!");
      setHasilKunjungan("");
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10"></div>

      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden hover:shadow-3xl transition-all duration-300">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>

        <CardHeader className="text-center pt-8 pb-6">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Presensi Sales
          </CardTitle>
          <p className="text-gray-500 text-sm mt-2">
            📸 Izinkan akses kamera & 📍 lokasi untuk melanjutkan
          </p>
        </CardHeader>

        {error && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-red-50/80 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-shake">
            <span className="text-lg mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <CardContent className="space-y-6 px-8 pb-8">
          {/* NAMA */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Nama Lengkap
            </Label>
            <Input
              placeholder="Masukkan nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 bg-gray-50/80 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300/50 rounded-lg transition-all"
            />
          </div>

          {/* OUTLET - DITAMBAHKAN */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Nama Customer / Outlet
            </Label>
            <Input
              placeholder="Masukkan nama customer / outlet"
              value={outlet}
              onChange={(e) => setOutlet(e.target.value)}
              className="h-11 bg-gray-50/80 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300/50 rounded-lg transition-all"
            />
          </div>

          {/* KAMERA */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              📸 Foto Selfie
            </Label>

            <div className="relative w-full rounded-xl overflow-hidden shadow-lg bg-black/20 border-2 border-indigo-200/30">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-72 object-cover rounded-lg"
                style={{ transform: "scaleX(-1)" }}
              />

              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={takePhoto}
                  className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full border-3 border-white shadow-xl flex items-center justify-center hover:bg-white/40 active:scale-90 transition-all duration-200"
                  title="Ambil foto"
                >
                  <div className="w-11 h-11 bg-white rounded-full"></div>
                </button>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {preview && (
              <div className="relative rounded-lg overflow-hidden shadow-lg border-2 border-indigo-200/30 animate-fade-in">
                <img src={preview} className="w-full h-auto" alt="Preview" />
                <div className="absolute top-3 right-3 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" /> Tersimpan
                </div>
              </div>
            )}
          </div>

          {/* LOKASI */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4" /> Lokasi & Alamat
            </Label>

            <div className="relative bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border border-indigo-200/30 rounded-lg p-4 space-y-3">
              {coords ? (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">
                        Koordinat
                      </p>
                      <p className="text-sm text-gray-800 font-mono">
                        <span className="block">
                          📍 Lat:{" "}
                          <span className="font-semibold">
                            {coords.lat.toFixed(6)}
                          </span>
                        </span>
                        <span className="block">
                          📍 Lon:{" "}
                          <span className="font-semibold">
                            {coords.long.toFixed(6)}
                          </span>
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={getLocationWithAddress}
                      disabled={isRefreshing}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 font-semibold ${
                        refreshStatus === "loading"
                          ? "bg-blue-500/90 text-white"
                          : refreshStatus === "success"
                          ? "bg-green-500/90 text-white"
                          : refreshStatus === "error"
                          ? "bg-red-500/90 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                      title="Refresh lokasi"
                    >
                      {refreshStatus === "loading" && (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      )}
                      {refreshStatus === "success" && (
                        <CheckCircleIcon className="w-5 h-5 animate-bounce" />
                      )}
                      {refreshStatus === "error" && <span>✕</span>}
                      {refreshStatus === "idle" && (
                        <ArrowPathIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {address && (
                    <div className="pt-2 border-t border-indigo-200/50">
                      <p className="text-xs text-gray-600 font-medium mb-1">
                        Alamat
                      </p>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {address}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 text-gray-600">
                  <ArrowPathIcon className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="text-sm">Mengambil lokasi...</span>
                </div>
              )}
            </div>
          </div>

          {/* 🔵 FITUR HASIL KUNJUNGAN (1 input) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Hasil Kunjungan
            </Label>

            <textarea
              placeholder="Tulis hasil kunjungan di sini..."
              value={hasilKunjungan}
              onChange={(e) => setHasilKunjungan(e.target.value)}
              className="
                w-full min-h-[120px]
                bg-blue-50/70 
                border border-blue-300 
                focus:border-blue-500 
                focus:ring-2 
                focus:ring-blue-300/50 
                rounded-xl 
                shadow-inner 
                p-3 
                text-gray-700 
                leading-relaxed 
                resize-none 
                font-medium 
                tracking-wide 
                outline-none
              "
            />
          </div>


          {/* SUBMIT */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sedang memproses...
              </span>
            ) : (
              "✓ Submit Presensi"
            )}
          </Button>

          {/* LINK */}
          <div className="text-center pt-2">
            <a
              href="/login"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition"
            >
              🔐 Login Admin
            </a>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-gray-500 text-sm">
        © 2025 Presensi Sales. All rights reserved.
      </p>
    </div>
  );
}
