import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket } from "../realtime/socket";
import { useAuth } from "./AuthContext";

const DataSyncContext = createContext({ dataVersion: 0 });

export const useDataSync = () => useContext(DataSyncContext);

export const DataSyncProvider = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();
    const onChanged = () => {
      setDataVersion((v) => v + 1);
      queryClient.invalidateQueries();
    };

    socket.on("dataChanged", onChanged);

    return () => {
      socket.off("dataChanged", onChanged);
    };
  }, [user, queryClient]);

  const value = useMemo(() => ({ dataVersion }), [dataVersion]);

  return <DataSyncContext.Provider value={value}>{children}</DataSyncContext.Provider>;
};