/* Icon adapter: exposes the icon names used across the app, rendered with Hugeicons. */
import { forwardRef } from "react";
import type { SVGProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowDownRight01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  CallIcon,
  Cancel01Icon,
  CancelCircleIcon,
  ChartIncreaseIcon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Clock01Icon,
  ComputerIcon,
  CreditCardIcon,
  DashboardSquare01Icon,
  Delete02Icon,
  DeliveryTruck01Icon,
  Dollar01Icon,
  DragDropVerticalIcon,
  Edit02Icon,
  Facebook01Icon,
  FavouriteIcon,
  FilterHorizontalIcon,
  GameController01Icon,
  GridViewIcon,
  HeadphonesIcon,
  Home01Icon,
  Image01Icon,
  InformationCircleIcon,
  InstagramIcon,
  Location01Icon,
  Logout01Icon,
  Mail01Icon,
  Menu01Icon,
  Message01Icon,
  MinusSignIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  NewTwitterIcon,
  PackageIcon,
  PackageOpenIcon,
  PlusSignIcon,
  Search01Icon,
  SecurityCheckIcon,
  SentIcon,
  Share08Icon,
  ShoppingBag02Icon,
  ShoppingCart01Icon,
  SidebarLeftIcon,
  SlidersHorizontalIcon,
  SmartWatch01Icon,
  SmartphoneIcon,
  SquareLock02Icon,
  StarIcon,
  Tag01Icon,
  Tick02Icon,
  Undo02Icon,
  Upload01Icon,
  UserGroupIcon,
  UserIcon,
  ViewIcon,
  YoutubeIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";

type IconData = typeof Search01Icon;
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> { size?: number | string; strokeWidth?: number; }
export type LucideIcon = ReturnType<typeof make>;

function make(icon: IconData, name: string) {
  const C = forwardRef<SVGSVGElement, IconProps>(({ size = 24, strokeWidth = 1.8, className, ...rest }, ref) => (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <HugeiconsIcon ref={ref as any} icon={icon} size={size} strokeWidth={strokeWidth} className={className} {...(rest as any)} />
  ));
  C.displayName = name;
  return C;
}

export const AlertCircle = make(AlertCircleIcon, "AlertCircle");
export const ArrowDownRight = make(ArrowDownRight01Icon, "ArrowDownRight");
export const ArrowLeft = make(ArrowLeft02Icon, "ArrowLeft");
export const ArrowRight = make(ArrowRight02Icon, "ArrowRight");
export const ArrowUpRight = make(ArrowUpRight01Icon, "ArrowUpRight");
export const Box = make(PackageOpenIcon, "Box");
export const Check = make(Tick02Icon, "Check");
export const CheckCircle = make(CheckmarkCircle02Icon, "CheckCircle");
export const CheckCircle2 = make(CheckmarkCircle02Icon, "CheckCircle2");
export const ChevronDown = make(ArrowDown01Icon, "ChevronDown");
export const ChevronLeft = make(ArrowLeft01Icon, "ChevronLeft");
export const ChevronRight = make(ArrowRight01Icon, "ChevronRight");
export const ChevronUp = make(ArrowUp01Icon, "ChevronUp");
export const Circle = make(CircleIcon, "Circle");
export const Clock = make(Clock01Icon, "Clock");
export const CreditCard = make(CreditCardIcon, "CreditCard");
export const DollarSign = make(Dollar01Icon, "DollarSign");
export const Dot = make(CircleIcon, "Dot");
export const Edit3 = make(Edit02Icon, "Edit3");
export const Eye = make(ViewIcon, "Eye");
export const Facebook = make(Facebook01Icon, "Facebook");
export const Filter = make(FilterHorizontalIcon, "Filter");
export const Gamepad2 = make(GameController01Icon, "Gamepad2");
export const GripVertical = make(DragDropVerticalIcon, "GripVertical");
export const Headphones = make(HeadphonesIcon, "Headphones");
export const Heart = make(FavouriteIcon, "Heart");
export const Home = make(Home01Icon, "Home");
export const Image = make(Image01Icon, "Image");
export const Info = make(InformationCircleIcon, "Info");
export const Instagram = make(InstagramIcon, "Instagram");
export const LayoutDashboard = make(DashboardSquare01Icon, "LayoutDashboard");
export const LayoutGrid = make(GridViewIcon, "LayoutGrid");
export const Lock = make(SquareLock02Icon, "Lock");
export const LogOut = make(Logout01Icon, "LogOut");
export const Mail = make(Mail01Icon, "Mail");
export const MapPin = make(Location01Icon, "MapPin");
export const Menu = make(Menu01Icon, "Menu");
export const MessageSquare = make(Message01Icon, "MessageSquare");
export const Minus = make(MinusSignIcon, "Minus");
export const Monitor = make(ComputerIcon, "Monitor");
export const MoreHorizontal = make(MoreHorizontalIcon, "MoreHorizontal");
export const MoreVertical = make(MoreVerticalIcon, "MoreVertical");
export const Package = make(PackageIcon, "Package");
export const PanelLeft = make(SidebarLeftIcon, "PanelLeft");
export const Phone = make(CallIcon, "Phone");
export const Plus = make(PlusSignIcon, "Plus");
export const RotateCcw = make(Undo02Icon, "RotateCcw");
export const Search = make(Search01Icon, "Search");
export const Send = make(SentIcon, "Send");
export const Share2 = make(Share08Icon, "Share2");
export const ShieldCheck = make(SecurityCheckIcon, "ShieldCheck");
export const ShoppingBag = make(ShoppingBag02Icon, "ShoppingBag");
export const ShoppingCart = make(ShoppingCart01Icon, "ShoppingCart");
export const SlidersHorizontal = make(SlidersHorizontalIcon, "SlidersHorizontal");
export const Smartphone = make(SmartphoneIcon, "Smartphone");
export const Star = make(StarIcon, "Star");
export const Tag = make(Tag01Icon, "Tag");
export const Trash2 = make(Delete02Icon, "Trash2");
export const TrendingUp = make(ChartIncreaseIcon, "TrendingUp");
export const Truck = make(DeliveryTruck01Icon, "Truck");
export const Twitter = make(NewTwitterIcon, "Twitter");
export const Upload = make(Upload01Icon, "Upload");
export const User = make(UserIcon, "User");
export const Users = make(UserGroupIcon, "Users");
export const Watch = make(SmartWatch01Icon, "Watch");
export const X = make(Cancel01Icon, "X");
export const XCircle = make(CancelCircleIcon, "XCircle");
export const Youtube = make(YoutubeIcon, "Youtube");
export const Zap = make(ZapIcon, "Zap");
