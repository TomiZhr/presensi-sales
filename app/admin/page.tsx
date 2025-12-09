"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AdminPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("presensi")
        .select("*")
        .order("id", { ascending: false });

      if (!data) return;

      const filtered = filterDate
        ? data.filter((r) => {
            const recordDate = new Date(r.created_at).toISOString().split("T")[0];
            return recordDate === filterDate;
          })
        : data;

      setRecords(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate]);

  const exportToExcel = () => {
    const formatted = records.map((r, index) => ({
      No: index + 1,
      Nama: r.name,
      Outlet: r.outlet_name || "-",
      Foto: r.photo_url,
      Waktu: new Date(r.created_at).toLocaleString("id-ID"),
      Alamat: r.address,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presensi");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(file, `data-presensi-${filterDate || "all"}.xlsx`);
  };

  const SkeletonRow = () => (
    <TableRow>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <TableCell key={i}>
          <div className="h-6 bg-gray-200/50 rounded animate-pulse"></div>
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 md:p-8 flex justify-center relative overflow-hidden">

      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10"></div>

      <Card className="w-full max-w-6xl bg-white/95 backdrop-blur-2xl shadow-2xl rounded-2xl border border-white/60 overflow-hidden hover:shadow-3xl transition-all duration-300">

        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>

        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 md:gap-6 pb-6 pt-8">
          <div>
            <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard Admin
            </CardTitle>
            <p className="text-gray-500 text-sm mt-1">Kelola data presensi sales</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">

            <div className="relative flex-1 sm:flex-none">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 shadow-sm rounded-lg bg-gray-50/80 text-gray-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition"
              />
            </div>

            <Button
              onClick={exportToExcel}
              disabled={records.length === 0}
              className="rounded-lg px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Export</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-4 md:px-6 pb-8">
          <div className="w-full overflow-x-auto rounded-lg border border-gray-200/50">
            <Table className="min-w-full table-fixed">

              <TableHeader className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border-b border-gray-200/50">
                <TableRow>
                  <TableHead className="text-center text-sm font-semibold text-gray-700 h-12 w-[60px]">No</TableHead>
                  <TableHead className="text-center text-sm font-semibold text-gray-700 w-[150px]">Nama</TableHead>
                  <TableHead className="text-center text-sm font-semibold text-gray-700 w-[150px]">Customer / Outlet</TableHead>
                  <TableHead className="text-center text-sm font-semibold text-gray-700 w-[90px]">Foto</TableHead>
                  <TableHead className="text-center text-sm font-semibold text-gray-700 w-[130px]">Waktu</TableHead>
                  <TableHead className="text-center text-sm font-semibold text-gray-700 w-[200px]">Alamat</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">📭</span>
                        <p className="text-gray-500 font-medium">Tidak ada data presensi</p>
                        <p className="text-gray-400 text-sm">Coba ubah tanggal filter atau lakukan presensi lebih dahulu</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((rec, index) => (
                    <TableRow
                      key={rec.id}
                      className="hover:bg-indigo-50/40 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <TableCell className="w-[60px] text-center text-sm md:text-base text-gray-700 font-medium py-4">
                        {index + 1}
                      </TableCell>

                      {/* ⭐ NAMA (scrollable) */}
                      <TableCell className="w-[150px] text-center py-4">
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                          {rec.name}
                        </div>
                      </TableCell>

                      {/* ⭐ OUTLET (scrollable) */}
                      <TableCell className="w-[150px] text-center py-4">
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                          {rec.outlet_name || "-"}
                        </div>
                      </TableCell>

                      {/* FOTO */}
                      <TableCell className="w-[90px] py-4">
                        <div className="w-full h-full flex justify-center items-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="cursor-pointer group relative">
                                <img
                                  src={rec.photo_url}
                                  className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all"
                                  alt="foto presensi"
                                />
                                <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-all"></div>
                              </div>
                            </DialogTrigger>

                            <DialogContent className="p-0 bg-black/95 border-none max-w-full flex justify-center items-center rounded-xl">
                              <div className="relative">
                                <img
                                  src={rec.photo_url}
                                  className="max-h-[90vh] max-w-[90vw] rounded-lg"
                                  alt="zoom"
                                />
                                <a
                                  href={rec.photo_url}
                                  download
                                  className="absolute top-4 right-4 bg-white/95 hover:bg-white text-black px-4 py-2 rounded-lg shadow-lg text-sm font-semibold transition-all"
                                >
                                  💾 Download
                                </a>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>



                      {/* WAKTU */}
                      <TableCell className="w-[130px] text-center text-sm md:text-base py-4">
                        <Badge className="rounded-lg px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs md:text-sm shadow-md font-semibold">
                          {new Date(rec.created_at).toLocaleString("id-ID")}
                        </Badge>
                      </TableCell>

                      {/* ⭐ ALAMAT (scrollable) */}
                      <TableCell className="w-[200px] text-left py-4">
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                          {rec.address}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>

            </Table>
          </div>

          {!isLoading && records.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 flex justify-between items-center">
              <span>
                Total: <span className="font-semibold text-indigo-600">{records.length}</span> presensi
              </span>
            </div>
          )}
        </CardContent>

      </Card>
    </div>
  );
}
