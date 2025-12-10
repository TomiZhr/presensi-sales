"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
} from "@heroicons/react/24/solid";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AdminPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Jika pilih tanggal → auto ambil bulan
  const handleDateChange = (value: string) => {
    setFilterDate(value);
    if (value) {
      const month = value.slice(0, 7); // YYYY-MM
      setFilterMonth(month);
    }
  };

  // Jika pilih bulan → tanggal direset
  const handleMonthChange = (value: string) => {
    setFilterMonth(value);
    setFilterDate(""); // tanggal dikosongkan
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("presensi")
        .select("*")
        .order("id", { ascending: false });

      if (!data) return;

      let filtered = data;

      // PRIORITAS 1 → FILTER TANGGAL
      if (filterDate) {
        filtered = filtered.filter((r) => {
          const recordDate = r.created_at.split("T")[0];
          return recordDate === filterDate;
        });

        setRecords(filtered);
        return;
      }

      // PRIORITAS 2 → FILTER BULAN
      if (filterMonth) {
        filtered = filtered.filter((r) => {
          const month = r.created_at.slice(0, 7); // YYYY-MM
          return month === filterMonth;
        });
      }

      setRecords(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate, filterMonth]);

  const exportToExcel = () => {
    const formatted = records.map((r, index) => ({
      No: index + 1,
      Nama: r.name,
      Outlet: r.outlet_name || "-",
      Foto: r.photo_url,
      Waktu: new Date(r.created_at).toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      Alamat: r.address,
      Hasil_Kunjungan: r.kunjungan || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);

    const colWidths = Object.keys(formatted[0]).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...formatted.map((row: any) => String(row[key]).length)
      );
      return { wch: maxLength + 4 };
    });

    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presensi");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(file, `data-presensi-${filterMonth || "all"}.xlsx`);
  };

  const SkeletonRow = () => (
    <TableRow>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <TableCell key={i}>
          <div className="h-6 bg-gray-200/50 rounded animate-pulse"></div>
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 md:p-8 flex justify-center relative overflow-hidden">
      <Card className="w-full max-w-[1600px] bg-white/95 backdrop-blur-2xl shadow-2xl rounded-2xl border border-white/60 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>

        {/* HEADER */}
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-6 pt-8">
          <div>
            <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard Admin
            </CardTitle>
            <p className="text-gray-500 text-sm mt-1">
              Kelola data presensi sales
            </p>
          </div>

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">

            {/* FILTER BULAN */}
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50/80 text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>

            {/* FILTER TANGGAL */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50/80 text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>

            {/* EXPORT BUTTON */}
            <Button
              onClick={exportToExcel}
              disabled={records.length === 0}
              className="rounded-lg px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export
            </Button>
          </div>
        </CardHeader>

        {/* TABLE */}
        <CardContent className="px-4 md:px-6 pb-8">
          <div className="w-full overflow-x-auto border rounded-lg">
            <Table className="min-w-full table-fixed">
              <TableHeader className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
                <TableRow>
                  <TableHead className="text-center w-[50px]">No</TableHead>
                  <TableHead className="text-center w-[150px]">Nama</TableHead>
                  <TableHead className="text-center w-[160px]">Customer / Outlet</TableHead>
                  <TableHead className="text-center w-[90px]">Foto</TableHead>
                  <TableHead className="text-center w-[150px]">Waktu</TableHead>
                  <TableHead className="text-center w-[200px]">Alamat</TableHead>
                  <TableHead className="text-center w-[220px]">Hasil Kunjungan</TableHead>
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
                   <TableCell colSpan={7} className="text-center py-12"> 
                    <div className="flex flex-col items-center gap-2"> 
                    <span className="text-3xl">📭</span>
                     <p className="text-gray-500 font-medium">Tidak ada data presensi</p> 
                     <p className="text-gray-400 text-sm">Coba ubah tanggal filter atau lakukan presensi lebih dahulu</p>
                    </div> 
                   </TableCell> 
                  </TableRow>
                ) : (
                  records.map((rec, index) => (
                    <TableRow key={rec.id}>
                      <TableCell className="w-[60px] text-center text-sm md:text-base text-gray-700 font-medium py-4">
                        {index + 1}
                      </TableCell>

                      <TableCell className="w-[150px] text-center py-4">
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {rec.name}
                        </div>
                      </TableCell>

                      <TableCell className="w-[150px] text-center py-4">
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {rec.outlet_name}
                        </div>
                      </TableCell>

                      {/* FOTO */}
                      <TableCell className="w-[90px] py-4">
                         <div className="w-full h-full flex justify-center items-center"> 
                            <Dialog> 
                              <DialogTrigger asChild> 
                                <div className="cursor-pointer group relative"> 
                                  <img src={rec.photo_url} className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all" alt="foto presensi" /> 
                                    <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-all">
                                    </div> 
                                </div> 
                              </DialogTrigger> 
                              <DialogContent className="p-0 bg-black/95 border-none max-w-full flex justify-center items-center rounded-xl"> 
                                  <div className="relative">
                                      <img src={rec.photo_url} className="max-h-[90vh] max-w-[90vw] rounded-lg" alt="zoom" /> 
                                      <a href={rec.photo_url} download className="absolute top-4 right-4 bg-white/95 hover:bg-white text-black px-4 py-2 rounded-lg shadow-lg text-sm font-semibold transition-all" > 
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

                      <TableCell className="w-[200px] text-center py-4">
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                           {rec.address} 
                        </div> 
                      </TableCell>

                      <TableCell className="w-[220px] text-center py-4"> 
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide"> 
                          {rec.kunjungan || "-"} 
                        </div> 
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && records.length > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              Total:{" "}
              <span className="font-semibold text-indigo-600">
                {records.length}
              </span>{" "}
              presensi
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
