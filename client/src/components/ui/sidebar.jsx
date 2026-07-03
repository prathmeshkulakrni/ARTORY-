"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children, open, setOpen, animate }) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col w-[260px] flex-shrink-0 z-40 border-r border-dark-border/40",
        className
      )}
      animate={{
        width: animate ? (open ? "260px" : "72px") : "260px",
      }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "h-14 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-dark-card border-b border-dark-border w-full z-40"
      )}
      {...props}
    >
      <div className="flex justify-between w-full items-center">
        <button className="text-white" onClick={() => setOpen(!open)}>
          <IconMenu2 className="h-6 w-6" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-dark-card p-4 z-[100] flex flex-col gap-4",
              className
            )}
          >
            <div className="flex justify-end">
              <button className="text-white" onClick={() => setOpen(false)}>
                <IconX className="h-6 w-6" />
              </button>
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({ link, className, onClick, ...props }) => {
  const { open, animate } = useSidebar();
  
  const content = (
    <>
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="font-medium whitespace-pre inline-block !p-0 !m-0 text-[14px]"
      >
        {link.label}
      </motion.span>
    </>
  );

  if (link.to) {
    return (
      <NavLink
        to={link.to}
        onClick={onClick}
        className={({ isActive }) => cn(
          "flex items-center justify-start gap-3 group/sidebar py-2.5 px-3 rounded-xl hover:bg-surface cursor-pointer text-gray-400 hover:text-white transition-all duration-200",
          isActive ? "text-white bg-gradient-to-r from-primary/20 to-accent/10 border-l-[3px] border-primary" : "",
          className
        )}
        {...props}
      >
        {content}
      </NavLink>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-2.5 px-3 rounded-xl hover:bg-surface cursor-pointer text-gray-400 hover:text-white transition-all duration-200",
        className
      )}
      {...props}
    >
      {content}
    </div>
  );
};
