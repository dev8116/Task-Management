import React from "react";
import { statusOptionsByRole } from "../../utils/projectStatus";

const ProjectStatusSelect = ({ role, value, onChange, disabled }) => {
  const opts = statusOptionsByRole(role);
  if (!opts.length) return <input value={value} readOnly />;
  return (
    <select name="status" value={value} onChange={onChange} disabled={disabled}>
      {opts.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
};

export default ProjectStatusSelect;