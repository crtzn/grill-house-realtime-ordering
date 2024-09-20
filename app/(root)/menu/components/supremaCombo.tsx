"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Edit, Trash, Radio } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/HeaderBox";
import { createClient } from "@supabase/supabase-js";
import { Label } from "@/components/ui/label";
import supabase from "@/lib/AnonSupabase";
import InputForm from "@/components/menu/components/InputForm";
import SelectPackage from "@/components/menu/components/SelectPackage";

function supremaCombo() {
  return <div>clasica</div>;
}

export default supremaCombo;
