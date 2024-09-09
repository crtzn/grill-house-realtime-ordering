import React from "react";

type Header = {
  title: string;
  label?: string;
};

function HeaderBox({ title, label }: Header) {
  return (
    <div className="header-box">
      <h1 className="header-box-title">{title}</h1>
      <p>{label}</p>
    </div>
  );
}

export default HeaderBox;
