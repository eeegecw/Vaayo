"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Bell, CalendarClock, CarFront, ChevronDown, ChevronUp,
  CheckCircle2, Clock3, KeyRound, Loader2, LogOut, MapPin, Menu,
  Navigation, ShieldCheck, Users, Wallet, X,
  ClipboardList, AlertCircle, Phone, Mail
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "customer" | "driver" | "admin";
type View = "home" | "bookings" | "driver" | "admin";
type ServiceType = "one_way" | "hourly" | "full_day";
type Profile = { id: string; full_name: string | null; phone: string | null; role: Role };
type Booking = {
  id: string; customer_id: string; driver_id: string | null; service_type: ServiceType;
  pickup: string; destination: string | null; scheduled_at: string | null;
  duration_hours: number | null; status: string; quoted_fare: number | null; created_at: string;
};
type DriverApplication = {
  id: string; user_id: string; full_name: string; license_number: string;
  status: string; created_at: string;
};
type DriverProfile = { id: string; full_name: string | null; phone: string | null };

const services: { id: ServiceType; title: string; description: string }[] = [
  { id: "one_way", title: "One-way", description: "A professional driver for a single journey." },
  { id: "hourly", title: "Hourly", description: "Keep a driver with you for as long as you need." },
  { id: "full_day", title: "Full-day", description: "A dedicated driver for your day out." },
];

const prettyStatus = (status: string) => status.replaceAll("_", " ");
const rupees = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function VayoApp() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const configured = Boolean(supabase);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState<"services" | "resources" | "pricing" | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<"services" | "resources" | "pricing" | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [service, setService] = useState<ServiceType>("one_way");
  const [pickup, setPickup] = useState("Mananthavady");
  const [destination, setDestination] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationHours, setDurationHours] = useState("2");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [notice, setNotice] = useState("");
  const [appName, setAppName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [applicationBusy, setApplicationBusy] = useState(false);
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, string>>({});
  const [assignDrafts, setAssignDrafts] = useState<Record<string, string>>({});
  const [adminBusyId, setAdminBusyId] = useState("");

  useEffect(() => {
    if (!menuOpen && !desktopMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    if (menuOpen) document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setDesktopMenuOpen(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, desktopMenuOpen]);

  useEffect(() => {
    const appRoot = document.querySelector(".app-shell");
    if (!appRoot) return;

    appRoot.classList.add("motion-ready");

    const revealTargets = appRoot.querySelectorAll<HTMLElement>([
      ".pricing-heading",
      ".pricing-card",
      ".section-head",
      ".service-card",
      ".booking-panel",
      ".help-heading",
      ".help-card",
      ".footer-brand-block",
      ".footer-column",
      ".footer-contact",
      ".footer-presence",
      ".footer-bottom",
      ".page-heading",
      ".stat-card",
      ".data-panel",
      ".application-card"
    ].join(", "));

    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    let lastScrollY = window.scrollY;
    let scrollDirection: "down" | "up" = "down";

    const handleScrollDirection = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) > 2) {
        scrollDirection = currentScrollY > lastScrollY ? "down" : "up";
        lastScrollY = currentScrollY;
      }
    };

    window.addEventListener("scroll", handleScrollDirection, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;

        // Reveal as the visitor moves down into a section.
        if (entry.isIntersecting && scrollDirection === "down") {
          element.classList.add("is-visible");
        }

        // Hide it again when scrolling back up past its lower edge.
        if (!entry.isIntersecting && scrollDirection === "up") {
          element.classList.remove("is-visible");
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -36px 0px",
    });

    revealTargets.forEach((element) => {
      element.classList.add("reveal-on-scroll");
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScrollDirection);
    };
  }, [view, authOpen, menuOpen]);

  const hydrateAccount = useCallback(async (currentUser: User) => {
    if (!supabase) return;
    setUser(currentUser);
    const { data } = await supabase.from("profiles")
      .select("id,full_name,phone,role").eq("id", currentUser.id).maybeSingle();
    const nextProfile = (data as Profile | null) ?? {
      id: currentUser.id, full_name: null, phone: currentUser.phone ?? null, role: "customer" as Role,
    };
    setProfile(nextProfile);
    if (nextProfile.role === "admin") setView("admin");
    else if (nextProfile.role === "driver") setView("driver");
    else setView("home");
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session?.user) void hydrateAccount(data.session.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) void hydrateAccount(session.user);
      else { setUser(null); setProfile(null); setBookings([]); setApplication(null); setView("home"); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [supabase, hydrateAccount]);

  const refreshBookings = useCallback(async () => {
    if (!supabase || !user) return;
    setLoadingBookings(true);
    const { data, error } = await supabase.from("bookings")
      .select("id,customer_id,driver_id,service_type,pickup,destination,scheduled_at,duration_hours,status,quoted_fare,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) setNotice(error.message);
    else setBookings((data ?? []) as Booking[]);
    setLoadingBookings(false);
  }, [supabase, user]);

  const refreshDriverData = useCallback(async () => {
    if (!supabase || !user) return;
    const { data } = await supabase.from("driver_applications")
      .select("id,user_id,full_name,license_number,status,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setApplication((data as DriverApplication | null) ?? null);
  }, [supabase, user]);

  const refreshAdminData = useCallback(async () => {
    if (!supabase || profile?.role !== "admin") return;
    const [{ data: appData }, { data: driverData }] = await Promise.all([
      supabase.from("driver_applications").select("id,user_id,full_name,license_number,status,created_at").eq("status", "pending").order("created_at"),
      supabase.from("profiles").select("id,full_name,phone").eq("role", "driver").order("full_name"),
    ]);
    setApplications((appData ?? []) as DriverApplication[]);
    setDrivers((driverData ?? []) as DriverProfile[]);
  }, [supabase, profile?.role]);

  useEffect(() => {
    if (!user) return;
    void refreshBookings();
    if (profile?.role === "customer") void refreshDriverData();
    if (profile?.role === "admin") void refreshAdminData();
  }, [user, profile?.role, refreshBookings, refreshDriverData, refreshAdminData]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (!supabase) {
      setAuthError("Supabase is not connected yet. Add the project URL and publishable key to .env.local first.");
      return;
    }
    if (password.length < 8) {
      setAuthError("Use a password with at least 8 characters.");
      return;
    }
    if (authMode === "signup" && !username.trim()) {
      setAuthError("Enter a username or display name.");
      return;
    }

    setAuthBusy(true);
    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: username.trim() } },
      });
      setAuthBusy(false);
      if (error) {
        setAuthError(error.message);
        return;
      }
      if (data.session && data.user) {
        await hydrateAccount(data.user);
        setAuthOpen(false);
        setPassword("");
        setAuthMessage("Your VAYO account is ready.");
      } else {
        setAuthMessage("Account created. Check your email for a confirmation link before signing in.");
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setAuthBusy(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    if (data.user) await hydrateAccount(data.user);
    setAuthOpen(false);
    setPassword("");
    setAuthMessage("You're signed in.");
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setProfile(null); setBookings([]); setView("home");
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    if (!user) { setAuthOpen(true); setAuthMode("signin"); setAuthError("Sign in with your email and password to request a driver."); return; }
    if (!supabase) return;
    if (!pickup.trim() || (service === "one_way" && !destination.trim())) {
      setNotice("Please enter your pickup and destination."); return;
    }
    setBookingBusy(true);
    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id, service_type: service, pickup: pickup.trim(),
      destination: destination.trim() || null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      duration_hours: service === "hourly" ? Number(durationHours) : null,
      status: "requested",
    });
    setBookingBusy(false);
    if (error) setNotice(error.message);
    else {
      setNotice("Your request has been sent. The VAYO team will review it and add the fare before confirming.");
      setDestination(""); setScheduledAt(""); setDurationHours("2"); setView("bookings"); await refreshBookings();
    }
  }

  async function submitDriverApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    if (!user || !supabase) { setAuthOpen(true); return; }
    if (!appName.trim() || !licenseNumber.trim()) { setNotice("Please complete both fields."); return; }
    setApplicationBusy(true);
    const { error } = await supabase.from("driver_applications").insert({
      user_id: user.id, full_name: appName.trim(), license_number: licenseNumber.trim(), status: "pending",
    });
    setApplicationBusy(false);
    if (error) setNotice(error.code === "23505" ? "You already have a driver application with us." : error.message);
    else { setNotice("Application submitted. Our team will verify your documents and contact you."); await refreshDriverData(); }
  }

  async function respondToQuote(bookingId: string, accept: boolean) {
    if (!supabase) return;
    const { error } = await supabase.rpc("respond_to_booking_quote", { p_booking_id: bookingId, p_accept: accept });
    if (error) setNotice(error.message);
    else { setNotice(accept ? "Quote accepted. VAYO will arrange your driver." : "Quote declined."); await refreshBookings(); }
  }

  async function updateQuote(booking: Booking) {
    if (!supabase || profile?.role !== "admin") return;
    const amount = Number(quoteDrafts[booking.id]);
    if (!Number.isFinite(amount) || amount <= 0) { setNotice("Enter a valid fare greater than zero."); return; }
    setAdminBusyId(booking.id);
    const { error } = await supabase.rpc("admin_set_booking_quote", {
      p_booking_id: booking.id,
      p_amount: amount,
    });
    setAdminBusyId("");
    if (error) setNotice(error.message);
    else { setNotice("Fare saved and sent to the customer."); await refreshBookings(); }
  }

  async function assignDriver(booking: Booking) {
    if (!supabase || profile?.role !== "admin") return;
    const driverId = assignDrafts[booking.id];
    if (!driverId) { setNotice("Choose a verified driver first."); return; }
    setAdminBusyId(booking.id);
    const { error } = await supabase.rpc("admin_assign_driver", {
      p_booking_id: booking.id,
      p_driver_id: driverId,
    });
    setAdminBusyId("");
    if (error) setNotice(error.message);
    else { setNotice("Driver assigned."); await refreshBookings(); }
  }

  async function reviewApplication(applicationId: string, approve: boolean) {
    if (!supabase) return;
    setAdminBusyId(applicationId);
    const { error } = await supabase.rpc("review_driver_application", {
      p_application_id: applicationId, p_approve: approve,
    });
    setAdminBusyId("");
    if (error) setNotice(error.message);
    else { setNotice(approve ? "Driver approved." : "Application rejected."); await refreshAdminData(); }
  }

  async function driverProgress(bookingId: string, nextStatus: "in_progress" | "completed") {
    if (!supabase) return;
    setAdminBusyId(bookingId);
    const { error } = await supabase.rpc("driver_update_booking_status", {
      p_booking_id: bookingId, p_new_status: nextStatus,
    });
    setAdminBusyId("");
    if (error) setNotice(error.message);
    else { setNotice("Trip status updated."); await refreshBookings(); }
  }

  const myBookings = bookings.filter((b) => profile?.role === "admin" || b.customer_id === user?.id);
  const assignedBookings = bookings.filter((b) => b.driver_id === user?.id);
  const pendingCount = bookings.filter((b) => b.status === "requested").length;
  const revenueQuotes = bookings.filter((b) => b.quoted_fare !== null).length;

  function openAuth(mode: "signin" | "signup") {
    setDesktopMenuOpen(null);
    setMenuOpen(false);
    setMobileExpanded(null);
    setAuthMode(mode);
    setAuthError("");
    setAuthMessage("");
    setAuthOpen(true);
  }

  function go(next: View) {
    setView(next);
    setMenuOpen(false);
    setDesktopMenuOpen(null);
    setMobileExpanded(null);
    setNotice("");
    if (next === "bookings") void refreshBookings();
    if (next === "admin") void refreshAdminData();
    if (next === "driver") void refreshBookings();
  }

  function goHome() {
    go("home");
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 60);
  }

  function goToHomeSection(sectionId: string) {
    setView("home");
    setMenuOpen(false);
    setDesktopMenuOpen(null);
    setMobileExpanded(null);
    setNotice("");
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleFooterPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stage = event.currentTarget;
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const x = Math.max(-1, Math.min(1, (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2)));
    const y = Math.max(-1, Math.min(1, (event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2)));
    const cars = stage.querySelectorAll<HTMLElement>(".footer-floating-car");
    const response = [
      { x: 17, y: 12 },
      { x: 11, y: 8 },
      { x: 14, y: 10 },
    ];

    cars.forEach((car, index) => {
      const strength = response[index] ?? response[0];
      car.style.setProperty("--mouse-x", `${x * strength.x}px`);
      car.style.setProperty("--mouse-y", `${y * strength.y}px`);
    });
  }

  function resetFooterPointer() {
    const cars = document.querySelectorAll<HTMLElement>(".footer-showcase-stage .footer-floating-car");
    cars.forEach((car) => {
      car.style.setProperty("--mouse-x", "0px");
      car.style.setProperty("--mouse-y", "0px");
    });
  }

  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="VAYO home" title="Go to home" onClick={(e) => { e.preventDefault(); goHome(); }}>
          <span className="brand-mark">V</span>
          <span><span className="brand-name">VAYO</span><span className="brand-tag">PERSONAL DRIVER SERVICE</span></span>
        </Link>

        <div className="top-actions">
          <nav className="desktop-links" aria-label="Main navigation">
            <button className={`nav-link nav-trigger ${desktopMenuOpen === "services" ? "active" : ""}`} aria-expanded={desktopMenuOpen === "services"} aria-controls="vayo-services-menu" onClick={() => setDesktopMenuOpen(desktopMenuOpen === "services" ? null : "services")}>
              Services <ChevronDown size={13}/>
            </button>
            <button className={`nav-link nav-trigger ${desktopMenuOpen === "resources" ? "active" : ""}`} aria-expanded={desktopMenuOpen === "resources"} aria-controls="vayo-resources-menu" onClick={() => setDesktopMenuOpen(desktopMenuOpen === "resources" ? null : "resources")}>
              Resources <ChevronDown size={13}/>
            </button>
            <button className={`nav-link nav-trigger ${desktopMenuOpen === "pricing" ? "active" : ""}`} aria-expanded={desktopMenuOpen === "pricing"} aria-controls="vayo-pricing-menu" onClick={() => setDesktopMenuOpen(desktopMenuOpen === "pricing" ? null : "pricing")}>
              Pricing <ChevronDown size={13}/>
            </button>
            <button className="nav-link nav-direct" onClick={() => go("driver")}>For drivers</button>
            {user && profile?.role === "driver" && <button className={`nav-link nav-direct ${view === "driver" ? "active" : ""}`} onClick={() => go("driver")}>Driver desk</button>}
            {user && profile?.role === "admin" && <button className={`nav-link nav-direct ${view === "admin" ? "active" : ""}`} onClick={() => go("admin")}>Admin</button>}
          </nav>

          <div className="nav-account">
            {user ? (
              <>
                <button className="nav-login" onClick={() => go("bookings")}>My bookings</button>
                <button className="nav-signup" onClick={signOut}>Sign out</button>
              </>
            ) : (
              <>
                <button className="nav-login" onClick={() => openAuth("signin")}>Log in</button>
                <button className="nav-signup" onClick={() => openAuth("signup")}>Sign up</button>
              </>
            )}
          </div>

          <button className="mobile-menu" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => { setMenuOpen(!menuOpen); setDesktopMenuOpen(null); setMobileExpanded(null); }}>
            {menuOpen ? <X size={22}/> : <Menu size={20}/>}
          </button>
        </div>

        {desktopMenuOpen && (
          <>
            <button className="nav-mega-backdrop" aria-label="Close navigation menu" onClick={() => setDesktopMenuOpen(null)}/>
            <div id={`vayo-${desktopMenuOpen}-menu`} className={`nav-mega-panel nav-mega-${desktopMenuOpen}`} role="region" aria-label={`${desktopMenuOpen} menu`}>
              {desktopMenuOpen === "services" && (
                <>
                  <div className="nav-mega-intro">
                    <span className="nav-mega-kicker">VAYO SERVICES</span>
                    <h2>One driver. Three ways to travel.</h2>
                    <p>Choose the kind of help you need. A VAYO driver comes to you and drives your own car.</p>
                    <button className="nav-mega-cta" onClick={() => goToHomeSection("book-driver")}>Book a driver <ArrowRight size={15}/></button>
                  </div>
                  <div className="nav-mega-content">
                    <span className="nav-mega-label">CHOOSE A SERVICE</span>
                    <div className="nav-mega-service-list">
                      {services.map((item, index) => (
                        <button className="nav-mega-item" key={item.id} onClick={() => goToHomeSection("services")}>
                          <span className="nav-mega-index">0{index + 1}</span>
                          <span className="nav-mega-item-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
                          <ArrowUpRight size={16}/>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {desktopMenuOpen === "resources" && (
                <>
                  <div className="nav-mega-intro">
                    <span className="nav-mega-kicker">HERE TO HELP</span>
                    <h2>Everything you need to get moving.</h2>
                    <p>Find out how the service works, get help with a booking, or learn how to join the VAYO driver network.</p>
                  </div>
                  <div className="nav-mega-content">
                    <span className="nav-mega-label">EXPLORE VAYO</span>
                    <div className="nav-mega-resource-grid">
                      <button className="nav-mega-resource" onClick={() => goToHomeSection("top")}>
                        <strong>How it works</strong><small>See how a driver request becomes a confirmed trip.</small><ArrowUpRight size={16}/>
                      </button>
                      <button className="nav-mega-resource" onClick={() => goToHomeSection("help")}>
                        <strong>Customer help</strong><small>Find the right place to start with your booking.</small><ArrowUpRight size={16}/>
                      </button>
                      <button className="nav-mega-resource" onClick={() => go("driver")}>
                        <strong>Driver opportunities</strong><small>Learn about applying to drive with VAYO.</small><ArrowUpRight size={16}/>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {desktopMenuOpen === "pricing" && (
                <>
                  <div className="nav-mega-intro">
                    <span className="nav-mega-kicker">CLEAR BEFORE YOU CONFIRM</span>
                    <h2>Your fare, shared upfront.</h2>
                    <p>VAYO reviews each request and shares the fare with you before the booking moves ahead.</p>
                    <button className="nav-mega-cta" onClick={() => goToHomeSection("charges")}>Explore fare process <ArrowRight size={15}/></button>
                  </div>
                  <div className="nav-mega-content">
                    <span className="nav-mega-label">NEXT STEPS</span>
                    <div className="nav-mega-resource-grid nav-mega-pricing-grid">
                      <button className="nav-mega-resource" onClick={() => goToHomeSection("charges")}>
                        <strong>How fares work</strong><small>Understand when your price is shared and approved.</small><ArrowUpRight size={16}/>
                      </button>
                      <button className="nav-mega-resource" onClick={() => goToHomeSection("book-driver")}>
                        <strong>Request a quote</strong><small>Send your trip details to the VAYO team.</small><ArrowUpRight size={16}/>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {menuOpen && (
          <div className="mobile-nav-overlay" role="dialog" aria-modal="true" aria-label="VAYO navigation">
            <div className="mobile-nav-top">
              <Link href="/" className="brand" aria-label="VAYO home" title="Go to home" onClick={(e) => { e.preventDefault(); goHome(); }}>
                <span className="brand-mark">V</span>
                <span><span className="brand-name">VAYO</span><span className="brand-tag">PERSONAL DRIVER SERVICE</span></span>
              </Link>
              <div className="mobile-nav-actions">
                {!user ? (
                  <button className="mobile-signup" onClick={() => openAuth("signup")}>Sign up</button>
                ) : (
                  <button className="mobile-signup" onClick={() => go("bookings")}>My bookings</button>
                )}
                <button className="mobile-close" aria-label="Close navigation menu" onClick={() => { setMenuOpen(false); setMobileExpanded(null); }}><X size={23}/></button>
              </div>
            </div>

            <nav className="mobile-nav-list" aria-label="Mobile navigation">
              <section className="mobile-nav-group">
                <button className="mobile-nav-toggle" aria-expanded={mobileExpanded === "services"} onClick={() => setMobileExpanded(mobileExpanded === "services" ? null : "services")}>
                  Services <ChevronDown size={18}/>
                </button>
                {mobileExpanded === "services" && (
                  <div className="mobile-nav-submenu">
                    {services.map((item) => (
                      <button key={item.id} onClick={() => goToHomeSection("services")}><strong>{item.title}</strong><small>{item.description}</small></button>
                    ))}
                  </div>
                )}
              </section>

              <section className="mobile-nav-group">
                <button className="mobile-nav-toggle" aria-expanded={mobileExpanded === "resources"} onClick={() => setMobileExpanded(mobileExpanded === "resources" ? null : "resources")}>
                  Resources <ChevronDown size={18}/>
                </button>
                {mobileExpanded === "resources" && (
                  <div className="mobile-nav-submenu">
                    <button onClick={() => goToHomeSection("top")}><strong>How it works</strong><small>See the steps from request to driver assignment.</small></button>
                    <button onClick={() => goToHomeSection("help")}><strong>Customer help</strong><small>Get help with a booking.</small></button>
                  </div>
                )}
              </section>

              <section className="mobile-nav-group">
                <button className="mobile-nav-toggle" aria-expanded={mobileExpanded === "pricing"} onClick={() => setMobileExpanded(mobileExpanded === "pricing" ? null : "pricing")}>
                  Pricing <ChevronDown size={18}/>
                </button>
                {mobileExpanded === "pricing" && (
                  <div className="mobile-nav-submenu">
                    <button onClick={() => goToHomeSection("charges")}><strong>How fares work</strong><small>Your fare is shared before you confirm.</small></button>
                    <button onClick={() => goToHomeSection("book-driver")}><strong>Request a quote</strong><small>Tell us about your journey.</small></button>
                  </div>
                )}
              </section>

              <button className="mobile-nav-direct" onClick={() => go("driver")}>For drivers <ArrowUpRight size={17}/></button>
              {user && <button className="mobile-nav-direct" onClick={() => go("bookings")}>My bookings <ArrowUpRight size={17}/></button>}
              {user && profile?.role === "driver" && <button className="mobile-nav-direct" onClick={() => go("driver")}>Driver desk <ArrowUpRight size={17}/></button>}
              {user && profile?.role === "admin" && <button className="mobile-nav-direct" onClick={() => go("admin")}>Admin dashboard <ArrowUpRight size={17}/></button>}
            </nav>

            <div className="mobile-nav-bottom">
              {!user && <button className="mobile-login" onClick={() => openAuth("signin")}>Already have an account? <strong>Log in</strong></button>}
              {user && <button className="mobile-login" onClick={signOut}>Sign out</button>}
              <span>Your car. Your journey. Our driver.</span>
            </div>
          </div>
        )}
      </header>

      {!configured && <div className="notice" style={{ margin: "16px 5.5vw 0" }}><AlertCircle size={16}/> Preview mode: connect Supabase to activate email/password accounts, save bookings and use the driver/admin workflows. Add your project URL and publishable key to <strong>.env.local</strong>.</div>}
      {notice && <div className="alert success" style={{ margin: "15px 5.5vw 0" }}>{notice}</div>}

      {view === "home" && (
        <>
          <main className="hero">
            <div className="hero-copy-column">
              <div className="eyebrow">A personal driver service in Wayanad</div>
              <h1>Someone to drive your car.<br/><em>That&apos;s VAYO.</em></h1>
              <p className="hero-copy">Need a driver for your own car? Request one with VAYO. Choose a one-way trip, book by the hour, or keep a driver for the day. We&apos;re starting in Mananthavady.</p>
              <div className="hero-cta">
                <button className="button button-dark" onClick={() => document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth" })}>Book a driver <ArrowRight size={15}/></button>
                <button className="button button-outline" onClick={() => user ? go("driver") : setAuthOpen(true)}>Become a driver <ArrowUpRight size={15}/></button>
              </div>
              <div className="trust-row">
                <span className="trust-item"><ShieldCheck size={14}/> Driver applications reviewed</span>
                <span className="trust-item"><MapPin size={14}/> Starting in Mananthavady</span>
              </div>
            </div>
            <aside className="hero-visual" aria-label="How VAYO works">
              <div className="hero-visual-top">
                <span>HOW IT WORKS</span>
                <span>MANANTHAVADY · WAYANAD</span>
              </div>
              <div className="hero-steps">
                <div className="hero-step">
                  <span className="hero-step-number">01</span>
                  <div><small>YOU SEND A REQUEST</small><strong>Tell us where you&apos;re going.</strong></div>
                </div>
                <div className="hero-step">
                  <span className="hero-step-number">02</span>
                  <div><small>WE SHARE THE FARE</small><strong>Review it before you decide.</strong></div>
                </div>
                <div className="hero-step">
                  <span className="hero-step-number">03</span>
                  <div><small>WE ARRANGE A DRIVER</small><strong>Your car stays yours.</strong></div>
                </div>
              </div>
              <div className="hero-visual-bottom"><span>VAYO / LOCAL DRIVER SERVICE</span><span>01 — 03</span></div>
            </aside>
          </main>

          <section className="pricing-section" id="charges">
            <div className="pricing-heading">
              <div className="eyebrow">Before you book</div>
              <h2>No guesswork on the fare.</h2>
              <p>Send us the details of your trip. The VAYO team will review the request and share a price for you to accept before the booking is confirmed.</p>
            </div>
            <div className="pricing-cards">
              <article className="pricing-card">
                <span className="pricing-step">01 / REQUEST</span>
                <h3>Tell us about the trip</h3>
                <p>Choose one-way, hourly or full-day service and share your pickup details.</p>
              </article>
              <article className="pricing-card">
                <span className="pricing-step">02 / REVIEW</span>
                <h3>See your fare first</h3>
                <p>We send you the fare through your VAYO account. No price is made up on this page.</p>
              </article>
              <article className="pricing-card">
                <span className="pricing-step">03 / DECIDE</span>
                <h3>Accept when ready</h3>
                <p>Review the quote and choose whether to accept it. The booking moves ahead after you agree.</p>
              </article>
            </div>
            <button className="pricing-cta" onClick={() => document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              See booking form <ArrowRight size={16}/>
            </button>
          </section>

          <section className="section" id="services">
            <div className="section-head">
              <div>
                <div className="eyebrow">Choose what suits your day</div>
                <h2>Three ways to book.</h2>
                <p className="section-sub">The driver comes to you and drives the car you already own.</p>
              </div>
            </div>
            <div className="service-grid">
              {services.map((item, index) => <button key={item.id} className="service-card" onClick={() => { setService(item.id); document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth" }); }} style={{ textAlign: "left" }}>
                <span className="service-number">0{index + 1} / 03</span>
                <h3>{item.title}</h3>
                <p>{item.id === "one_way" ? "A driver for one trip from your pickup point to your destination." : item.id === "hourly" ? "Keep a driver with you for the number of hours you need." : "Book a driver for the day, for errands, visits or a longer outing."}</p>
                <span className="service-card-link">Choose this service <ArrowRight size={14}/></span>
              </button>)}
            </div>
          </section>

          <section className="booking-wrap" id="book-driver">
            <div className="booking-panel">
              <aside className="booking-aside">
                <div className="eyebrow">Make a request</div>
                <h2>We&apos;ll take it from here.</h2>
                <p>Share the basics of your trip. The VAYO team will check the details, send you a fare and arrange a driver once you accept.</p>
                <div className="aside-note"><ShieldCheck size={17}/> Driver applications are reviewed before approval.</div>
              </aside>
              <form className="booking-form" onSubmit={submitBooking}>
                <h3 className="form-title">Where do you need a driver?</h3><p className="form-sub">This request is for a driver to take your own car.</p>
                <div className="service-options">
                  {services.map((item, index) => <button type="button" key={item.id} className={`service-option ${service === item.id ? "selected" : ""}`} onClick={() => setService(item.id)}>
                    {index === 0 ? <Navigation size={16}/> : index === 1 ? <Clock3 size={16}/> : <CalendarClock size={16}/>}<strong>{item.title}</strong>
                  </button>)}
                </div>
                <div className="field-grid">
                  <div className="field"><label htmlFor="pickup">PICKUP LOCATION</label><input id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Mananthavady" required/></div>
                  <div className="field"><label htmlFor="destination">DESTINATION {service !== "one_way" && "(OPTIONAL)"}</label><input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Where are you headed?" required={service === "one_way"}/></div>
                </div>
                {service === "hourly" && <div className="field"><label htmlFor="duration">HOW MANY HOURS?</label><select id="duration" value={durationHours} onChange={(e) => setDurationHours(e.target.value)}>{Array.from({ length: 12 }, (_, i) => i + 1).map((hours) => <option key={hours} value={String(hours)}>{hours} {hours === 1 ? "hour" : "hours"}</option>)}</select></div>}
                <div className="field"><label htmlFor="datetime">WHEN DO YOU NEED A DRIVER?</label><input id="datetime" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}/></div>
                <div className="form-foot"><span className="form-hint">No fare is charged at this stage. VAYO will share the admin-approved price with you.</span><button className="button button-dark" type="submit" disabled={bookingBusy}>{bookingBusy ? <Loader2 size={15} className="spinner"/> : null} Request a driver <ArrowRight size={14}/></button></div>
              </form>
            </div>
          </section>

          <section className="help-section" id="help">
            <div className="help-heading">
              <div className="eyebrow">A real person is behind the service</div>
              <h2>Need a hand?</h2>
              <p>Whether you need a driver or would like to work with us, here&apos;s where to start.</p>
            </div>
            <div className="help-cards">
              <article className="help-card">
                <span className="help-icon help-icon-dark"><Phone size={22} fill="currentColor"/></span>
                <div className="help-card-copy">
                  <span className="help-card-label">FOR CUSTOMERS</span>
                  <h3>Looking for a driver?</h3>
                  <p>Send us your trip details and we’ll get back to you with a fare.</p>
                  <button onClick={() => document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Make a booking request <ArrowRight size={14}/></button>
                </div>
              </article>
              <article className="help-card">
                <span className="help-icon help-icon-accent"><Mail size={22} fill="currentColor"/></span>
                <div className="help-card-copy">
                  <span className="help-card-label">FOR DRIVERS</span>
                  <h3>Interested in driving?</h3>
                  <p>Apply to join the local driver network. We’ll review your details before approval.</p>
                  <button onClick={() => go("driver")}>Read about applying <ArrowRight size={14}/></button>
                </div>
              </article>
            </div>
          </section>
        </>
      )}

      {view === "bookings" && (
        <main className="page-content">
          <div className="page-heading"><div><div className="eyebrow">Your VAYO account</div><h1>My bookings</h1><p className="section-sub">Track requests, review fares and see your trip history.</p></div><button className="button button-dark" onClick={() => go("home")}>New booking <ArrowRight size={14}/></button></div>
          <div className="dashboard-grid">
            <div className="stat-card"><ClipboardList className="stat-icon" size={19}/><div className="stat-label">Total bookings</div><div className="stat-value">{myBookings.length}</div></div>
            <div className="stat-card"><Clock3 className="stat-icon" size={19}/><div className="stat-label">Awaiting fare</div><div className="stat-value">{myBookings.filter((b) => b.status === "requested").length}</div></div>
            <div className="stat-card"><CheckCircle2 className="stat-icon" size={19}/><div className="stat-label">Quoted fares</div><div className="stat-value">{myBookings.filter((b) => b.quoted_fare !== null).length}</div></div>
          </div>
          <div className="data-panel"><div className="data-panel-head"><h3>Booking history</h3><button className="small-button" onClick={() => void refreshBookings()}><Bell size={12}/> Refresh</button></div>
            {loadingBookings ? <div className="empty-state"><Loader2 className="spinner" size={20}/><p>Loading bookings…</p></div> : myBookings.length === 0 ? <div className="empty-state"><span className="empty-icon"><CarFront size={22}/></span><div>No bookings yet</div><p>Your driver requests will appear here.</p></div> : <div className="table-wrap"><table><thead><tr><th>BOOKING</th><th>SERVICE</th><th>JOURNEY</th><th>DATE</th><th>FARE</th><th>STATUS / ACTION</th></tr></thead><tbody>{myBookings.map((b) => <tr key={b.id}><td>#{b.id.slice(0, 7).toUpperCase()}</td><td>{services.find((s) => s.id === b.service_type)?.title ?? b.service_type}{b.duration_hours ? ` · ${b.duration_hours}h` : ""}</td><td>{b.pickup} → {b.destination || "Flexible"}</td><td>{b.scheduled_at ? new Date(b.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "AS SOON AS POSSIBLE"}</td><td>{b.quoted_fare !== null ? rupees(b.quoted_fare) : "Pending"}</td><td>{b.status === "quoted" && profile?.role === "customer" ? <div className="inline-control"><button className="small-button" onClick={() => void respondToQuote(b.id, true)}>Accept</button><button className="small-button" style={{ background: "#eee", color: "#555" }} onClick={() => void respondToQuote(b.id, false)}>Decline</button></div> : <span className={`status ${b.status}`}>{prettyStatus(b.status)}</span>}</td></tr>)}</tbody></table></div>}
          </div>
        </main>
      )}

      {view === "driver" && (
        <main className="page-content">
          <div className="page-heading"><div><div className="eyebrow">Partner with VAYO</div><h1>Driver desk</h1><p className="section-sub">Manage your driver application and assigned trips.</p></div><span className="status approved">{profile?.role === "driver" ? "Verified partner" : "Driver application"}</span></div>
          {profile?.role !== "driver" ? <div className="application-card">
            <div className="service-icon"><CarFront size={21}/></div><h2>Drive with VAYO</h2><p>Apply to become a VAYO driver in Mananthavady. Our team will verify your identity and driving documents before activating your driver account.</p>
            {application ? <><div className={`status ${application.status}`}>{prettyStatus(application.status)}</div><div className="notice"><ShieldCheck size={16}/> Your application is on file. You can use this page to check the review status. Approval is completed by the VAYO admin team.</div></> : <form onSubmit={submitDriverApplication}>
              <div className="field"><label htmlFor="drivername">FULL NAME</label><input id="drivername" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Name as on your licence" required/></div>
              <div className="field"><label htmlFor="licence">DRIVING LICENCE NUMBER</label><input id="licence" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Enter your licence number" required/></div>
              <div className="notice"><ShieldCheck size={16}/> Do not upload document photos in this prototype. Secure document upload and verification will be added before pilot launch.</div>
              <button className="button button-dark" type="submit" disabled={applicationBusy}>{applicationBusy ? <Loader2 size={14} className="spinner"/> : null} Submit driver application <ArrowRight size={14}/></button>
            </form>}
          </div> : <>
            <div className="dashboard-grid"><div className="stat-card"><CarFront className="stat-icon" size={19}/><div className="stat-label">Assigned trips</div><div className="stat-value">{assignedBookings.length}</div></div><div className="stat-card"><CheckCircle2 className="stat-icon" size={19}/><div className="stat-label">Completed</div><div className="stat-value">{assignedBookings.filter((b) => b.status === "completed").length}</div></div><div className="stat-card"><Wallet className="stat-icon" size={19}/><div className="stat-label">Earnings</div><div className="stat-value">—</div></div></div>
            <div className="data-panel"><div className="data-panel-head"><h3>Your assigned trips</h3><button className="small-button" onClick={() => void refreshBookings()}>Refresh</button></div>
              {assignedBookings.length === 0 ? <div className="empty-state"><span className="empty-icon"><Navigation size={21}/></span><div>No assigned trips yet</div><p>New trips assigned by VAYO will appear here.</p></div> : <div className="table-wrap"><table><thead><tr><th>PICKUP</th><th>DESTINATION</th><th>SCHEDULE</th><th>FARE</th><th>ACTION</th></tr></thead><tbody>{assignedBookings.map((b) => <tr key={b.id}><td>{b.pickup}</td><td>{b.destination || "Flexible"}</td><td>{b.scheduled_at ? new Date(b.scheduled_at).toLocaleString("en-IN") : "Immediate"}</td><td>{b.quoted_fare ? rupees(b.quoted_fare) : "—"}</td><td>{b.status === "assigned" ? <button className="small-button" disabled={adminBusyId === b.id} onClick={() => void driverProgress(b.id, "in_progress")}>Start trip</button> : b.status === "in_progress" ? <button className="small-button" disabled={adminBusyId === b.id} onClick={() => void driverProgress(b.id, "completed")}>Complete trip</button> : <span className={`status ${b.status}`}>{prettyStatus(b.status)}</span>}</td></tr>)}</tbody></table></div>}
            </div>
          </>}
        </main>
      )}

      {view === "admin" && (
        <main className="page-content">
          {profile?.role !== "admin" ? <div className="application-card"><span className="empty-icon"><ShieldCheck size={22}/></span><h2>Admin access required</h2><p>This area is restricted to authorized VAYO administrators. Admin role must be granted securely in the Supabase database.</p></div> : <>
            <div className="page-heading"><div><div className="eyebrow">Operations control</div><h1>Admin dashboard</h1><p className="section-sub">Review requests, set fares and approve driver partners.</p></div><button className="button button-outline" onClick={() => { void refreshBookings(); void refreshAdminData(); }}>Refresh data</button></div>
            <div className="dashboard-grid"><div className="stat-card"><ClipboardList className="stat-icon" size={19}/><div className="stat-label">All bookings</div><div className="stat-value">{bookings.length}</div></div><div className="stat-card"><Clock3 className="stat-icon" size={19}/><div className="stat-label">New requests</div><div className="stat-value">{pendingCount}</div></div><div className="stat-card"><Users className="stat-icon" size={19}/><div className="stat-label">Verified drivers</div><div className="stat-value">{drivers.length}</div></div></div>
            <div className="data-panel" style={{ marginBottom: 22 }}><div className="data-panel-head"><h3>Booking requests & fare control</h3><span className="section-sub">{revenueQuotes} fares quoted</span></div>
              {bookings.length === 0 ? <div className="empty-state">No booking requests yet.</div> : <div className="table-wrap"><table><thead><tr><th>BOOKING</th><th>SERVICE</th><th>JOURNEY</th><th>STATUS</th><th>SET FARE (₹)</th><th>ASSIGN DRIVER</th></tr></thead><tbody>{bookings.map((b) => <tr key={b.id}><td>#{b.id.slice(0,7).toUpperCase()}</td><td>{services.find((s) => s.id === b.service_type)?.title}{b.duration_hours ? ` · ${b.duration_hours}h` : ""}</td><td>{b.pickup} → {b.destination || "Flexible"}</td><td><span className={`status ${b.status}`}>{prettyStatus(b.status)}</span></td><td>{b.status === "requested" ? <div className="inline-control"><input aria-label="Fare in rupees" type="number" min="1" placeholder="Amount" value={quoteDrafts[b.id] ?? ""} onChange={(e) => setQuoteDrafts({ ...quoteDrafts, [b.id]: e.target.value })}/><button className="small-button" disabled={adminBusyId === b.id} onClick={() => void updateQuote(b)}>Quote</button></div> : b.quoted_fare !== null ? rupees(b.quoted_fare) : "—"}</td><td>{b.status === "confirmed" ? <div className="inline-control"><select aria-label="Select driver" value={assignDrafts[b.id] ?? ""} onChange={(e) => setAssignDrafts({ ...assignDrafts, [b.id]: e.target.value })}><option value="">Choose driver</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name || d.phone || d.id.slice(0,6)}</option>)}</select><button className="small-button" disabled={adminBusyId === b.id || drivers.length === 0} onClick={() => void assignDriver(b)}>Assign</button></div> : b.driver_id ? "Assigned" : "—"}</td></tr>)}</tbody></table></div>}
            </div>
            <div className="data-panel"><div className="data-panel-head"><h3>Driver applications</h3><span className="status pending">{applications.length} pending</span></div>
              {applications.length === 0 ? <div className="empty-state">No pending driver applications.</div> : <div className="table-wrap"><table><thead><tr><th>APPLICANT</th><th>LICENCE NUMBER</th><th>SUBMITTED</th><th>REVIEW</th></tr></thead><tbody>{applications.map((a) => <tr key={a.id}><td>{a.full_name}</td><td>{a.license_number}</td><td>{new Date(a.created_at).toLocaleDateString("en-IN")}</td><td><div className="inline-control"><button className="small-button" disabled={adminBusyId === a.id} onClick={() => void reviewApplication(a.id, true)}>Approve</button><button className="small-button" style={{ background: "#eee", color: "#555" }} disabled={adminBusyId === a.id} onClick={() => void reviewApplication(a.id, false)}>Reject</button></div></td></tr>)}</tbody></table></div>}
            </div>
          </>}
        </main>
      )}

      <footer className="site-footer footer-showcase" id="site-footer">
        <div className="footer-showcase-links">
          <nav className="footer-column" aria-label="VAYO services">
            <h3>SERVICES</h3>
            <button onClick={() => goToHomeSection("book-driver")}>Book a driver</button>
            <button onClick={() => goToHomeSection("services")}>One-way trips</button>
            <button onClick={() => goToHomeSection("services")}>Hourly bookings</button>
            <button onClick={() => goToHomeSection("services")}>Full-day bookings</button>
          </nav>

          <section className="footer-column footer-showcase-area">
            <h3>SERVICE AREA</h3>
            <p>MANANTHAVADY</p>
            <p>WAYANAD</p>
            <p>KERALA, INDIA</p>
            <span className="footer-column-note">Starting locally, with more journeys ahead.</span>
          </section>

          <nav className="footer-column" aria-label="About VAYO">
            <h3>COMPANY</h3>
            <button onClick={() => goToHomeSection("top")}>About VAYO</button>
            <button onClick={() => go("driver")}>Drive with VAYO</button>
            <button onClick={() => goToHomeSection("help")}>Help &amp; support</button>
            <button onClick={() => goToHomeSection("charges")}>How fares work</button>
          </nav>

          <nav className="footer-column" aria-label="VAYO portals">
            <h3>YOUR VAYO</h3>
            <button onClick={() => user ? go("bookings") : openAuth("signin")}>My bookings</button>
            <button onClick={() => go("home")}>Customer portal</button>
            <button onClick={() => go("driver")}>Driver portal</button>
            <span className="footer-column-note">Your car. Your journey. Our driver.</span>
          </nav>
        </div>

        <div className="footer-bottom footer-showcase-meta">
          <span>© {new Date().getFullYear()} VAYO. ALL RIGHTS RESERVED.</span>
          <div className="footer-legal-links">
            <Link href="/terms">TERMS &amp; CONDITIONS</Link>
            <Link href="/privacy">PRIVACY POLICY</Link>
          </div>
        </div>

        <div
          className="footer-showcase-stage"
          aria-label="VAYO — your car, your journey, our driver"
          onPointerMove={handleFooterPointerMove}
          onPointerLeave={resetFooterPointer}
          onPointerCancel={resetFooterPointer}
        >
          <span className="footer-stage-caption">MADE FOR THE WAY YOU MOVE</span>

          <div className="footer-floating-car footer-car-sedan" aria-hidden="true">
            <svg viewBox="0 0 440 220" role="presentation">
              <defs>
                <linearGradient id="vayo-sedan-body" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#51434d"/><stop offset=".42" stopColor="#211b22"/><stop offset="1" stopColor="#08080b"/>
                </linearGradient>
                <linearGradient id="vayo-sedan-glass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#d8d1da"/><stop offset=".42" stopColor="#8e8a98"/><stop offset="1" stopColor="#343541"/>
                </linearGradient>
              </defs>
              <ellipse cx="222" cy="188" rx="178" ry="15" fill="#24151f" opacity=".18"/>
              <g fill="#101014" stroke="#756a73" strokeWidth="4">
                <circle cx="112" cy="164" r="35"/><circle cx="328" cy="164" r="35"/>
              </g>
              <g fill="#a8a2ab" stroke="#29262d" strokeWidth="5">
                <circle cx="112" cy="164" r="19"/><circle cx="328" cy="164" r="19"/>
              </g>
              <g stroke="#514b55" strokeWidth="3">
                <path d="M112 148v32M96 164h32M328 148v32M312 164h32"/>
              </g>
              <path d="M34 145 49 123Q58 111 82 105l60-17 43-43q13-13 34-13h65q19 0 33 14l43 43 30 10q23 8 32 27l8 28-5 22H365q-4-37-37-37t-37 37H147q-4-37-35-37t-35 37H42Z" fill="url(#vayo-sedan-body)" stroke="#151117" strokeWidth="4" strokeLinejoin="round"/>
              <path d="m153 87 42-41q9-9 25-9h61q13 0 23 11l39 39-92 5Z" fill="url(#vayo-sedan-glass)" stroke="#17141a" strokeWidth="5" strokeLinejoin="round"/>
              <path d="m239 42 8 48M340 86l-102 4" stroke="#34303a" strokeWidth="4"/>
              <path d="M59 125q28-20 61-22M360 111l28 10" fill="none" stroke="#9e929e" strokeWidth="3" opacity=".7"/>
              <path d="M39 141q30-13 54-9l-6 13H41Z" fill="#f4e5cb"/>
              <path d="M384 130q15 2 24 11l-2 8h-26Z" fill="#d1a6a8"/>
              <path d="M174 151h116" stroke="#c4bbc4" strokeWidth="3" opacity=".28"/>
              <path d="M57 160h22M379 160h20" stroke="#09090c" strokeWidth="6"/>
            </svg>
          </div>

          <div className="footer-floating-car footer-car-suv" aria-hidden="true">
            <svg viewBox="0 0 440 220" role="presentation">
              <defs>
                <linearGradient id="vayo-suv-body" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fffdfb"/><stop offset=".48" stopColor="#c7c2c8"/><stop offset="1" stopColor="#78747d"/>
                </linearGradient>
                <linearGradient id="vayo-suv-glass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#bac4ce"/><stop offset="1" stopColor="#454b58"/>
                </linearGradient>
              </defs>
              <ellipse cx="220" cy="190" rx="178" ry="14" fill="#392537" opacity=".18"/>
              <g fill="#141318" stroke="#8d8790" strokeWidth="4">
                <circle cx="107" cy="166" r="34"/><circle cx="330" cy="166" r="34"/>
              </g>
              <g fill="#d4d0d3" stroke="#55515a" strokeWidth="5">
                <circle cx="107" cy="166" r="18"/><circle cx="330" cy="166" r="18"/>
              </g>
              <g stroke="#716b74" strokeWidth="3">
                <path d="M107 151v30M92 166h30M330 151v30M315 166h30"/>
              </g>
              <path d="M26 145 39 117q8-16 30-22l54-13 36-38q12-13 35-13h93q23 0 38 16l39 40 34 9q23 7 31 26l10 30-7 24h-43q-3-36-35-36t-35 36H144q-3-36-37-36t-37 36H33Z" fill="url(#vayo-suv-body)" stroke="#77717b" strokeWidth="4" strokeLinejoin="round"/>
              <path d="m132 81 36-37q9-9 27-9h90q14 0 25 12l32 35-103 7Z" fill="url(#vayo-suv-glass)" stroke="#57515b" strokeWidth="5" strokeLinejoin="round"/>
              <path d="M228 39v51M320 82l-92 8" stroke="#5f5964" strokeWidth="4"/>
              <path d="M80 99h245" stroke="#fff" strokeWidth="3" opacity=".8"/>
              <path d="M37 130q33-17 57-12l-6 15-52 4Z" fill="#fff5dc"/>
              <path d="M380 124q18 3 29 14l-3 11h-34Z" fill="#a95f65"/>
              <path d="M54 154h290" stroke="#55515a" strokeWidth="3" opacity=".65"/>
              <path d="M60 112l-12-16M357 105l11-15" stroke="#48434b" strokeWidth="6" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="footer-floating-car footer-car-hatch" aria-hidden="true">
            <svg viewBox="0 0 440 220" role="presentation">
              <defs>
                <linearGradient id="vayo-hatch-body" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f3e4c9"/><stop offset=".5" stopColor="#aa9588"/><stop offset="1" stopColor="#66554f"/>
                </linearGradient>
                <linearGradient id="vayo-hatch-glass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#c8c3cb"/><stop offset="1" stopColor="#41404a"/>
                </linearGradient>
              </defs>
              <ellipse cx="218" cy="188" rx="172" ry="14" fill="#2e1a23" opacity=".18"/>
              <g fill="#141318" stroke="#817680" strokeWidth="4">
                <circle cx="112" cy="164" r="34"/><circle cx="322" cy="164" r="34"/>
              </g>
              <g fill="#c9c1c1" stroke="#49434a" strokeWidth="5">
                <circle cx="112" cy="164" r="18"/><circle cx="322" cy="164" r="18"/>
              </g>
              <g stroke="#736b71" strokeWidth="3">
                <path d="M112 149v30M97 164h30M322 149v30M307 164h30"/>
              </g>
              <path d="M30 144 43 120q9-15 29-19l54-13 48-48q12-12 34-12h75q19 0 35 13l47 44 28 8q24 7 34 28l9 30-7 24h-40q-3-35-36-35t-36 35H148q-3-35-36-35t-36 35H37Z" fill="url(#vayo-hatch-body)" stroke="#63545a" strokeWidth="4" strokeLinejoin="round"/>
              <path d="m143 84 43-44q8-8 23-8h72q15 0 26 11l39 38-102 10Z" fill="url(#vayo-hatch-glass)" stroke="#594d53" strokeWidth="5" strokeLinejoin="round"/>
              <path d="M243 35v54M346 81l-103 8" stroke="#62565e" strokeWidth="4"/>
              <path d="M55 123q23-15 58-14l-7 18H51Z" fill="#f7e9d4"/>
              <path d="M369 115q22 3 35 17l-3 12h-36Z" fill="#a9585d"/>
              <path d="M58 151h291" stroke="#4d4147" strokeWidth="3" opacity=".5"/>
              <path d="M168 111h100" stroke="#f7eee4" strokeWidth="3" opacity=".25"/>
            </svg>
          </div>

          <div className="footer-showcase-wordmark" aria-hidden="true">VAYO</div>
        </div>
      </footer>

      {authOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAuthOpen(false); }}>
        <div className="modal">
          <button className="modal-close" aria-label="Close" onClick={() => { setAuthOpen(false); setAuthError(""); setAuthMessage(""); }}><X size={16}/></button>
          <span className="brand-mark"><KeyRound size={20}/></span>
          <h2>{authMode === "signup" ? "Create your VAYO account" : "Welcome to VAYO"}</h2>
          <p>{authMode === "signup" ? "Create an account to book a driver or apply to drive with VAYO." : "Sign in to manage your bookings and driver account."}</p>
          <form onSubmit={submitAuth}>
            {authMode === "signup" && <div className="field"><label htmlFor="username">USERNAME / DISPLAY NAME</label><input id="username" className="input" type="text" autoComplete="name" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" minLength={2} maxLength={60} required/></div>}
            <div className="field"><label htmlFor="email">EMAIL ADDRESS</label><input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required/></div>
            <div className="field"><label htmlFor="password">PASSWORD</label><input id="password" className="input" type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required/></div>
            {authError && <div className="alert error">{authError}</div>}
            {authMessage && <div className="alert success">{authMessage}</div>}
            <button className="button button-dark" type="submit" style={{ width: "100%", marginTop: 7 }} disabled={authBusy}>
              {authBusy ? <Loader2 size={15} className="spinner"/> : <KeyRound size={14}/>} {authMode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={14}/>
            </button>
          </form>
          <button className="nav-link" type="button" style={{ width: "100%", marginTop: 12 }} onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); setAuthMessage(""); }}>
            {authMode === "signin" ? "New to VAYO? Create an account" : "Already registered? Sign in"}
          </button>
          <div className="notice"><ShieldCheck size={15}/> Passwords are managed securely by Supabase Auth. Your username is shown on your VAYO account; use your email address to sign in.</div>
        </div>
      </div>}
    </div>
  );
}
