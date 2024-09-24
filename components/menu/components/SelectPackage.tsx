import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClasicaMenu from "@/app/admin/(root)/menu/components/packages/clasica";
import ClasicaComboMenu from "@/app/admin/(root)/menu/components/packages/clasicaCombo";
import SupremaMenu from "@/app/admin/(root)/menu/components/packages/suprema";
import SupremaComboMenu from "@/app/admin/(root)/menu/components/packages/supremaCombo";

function SelectPackage() {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  const handleSelectPackage = (value: string) => {
    setSelectedMenu(value);
  };

  const renderSelectedMenu = () => {
    switch (selectedMenu) {
      case "Clasica":
        return <ClasicaMenu />;
      case "ClasicaCombo":
        return <ClasicaComboMenu />;
      case "Suprema":
        return <SupremaMenu />;
      case "SupremaCombo":
        return <SupremaComboMenu />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Select onValueChange={handleSelectPackage}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Menu" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="Clasica">Clasica</SelectItem>
          <SelectItem value="ClasicaCombo">Clasica Combo</SelectItem>
          <SelectItem value="Suprema">Suprema</SelectItem>
          <SelectItem value="SupremaCombo">Suprema Combo</SelectItem>
        </SelectContent>
      </Select>

      {renderSelectedMenu()}
    </div>
  );
}

export default SelectPackage;
