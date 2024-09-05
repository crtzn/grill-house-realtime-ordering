import React from "react";

type Header = {
  title: string;
};

function HeaderBox({ title }: Header) {
  return (
    <div className="header-box">
      <h1 className="header-box-title">{title}</h1>
      <p>Hi, User. Welcome back to Grill House Admin!</p>
    </div>
  );
}

export default HeaderBox;
