import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useEffect, useState } from "react";
import {
  BarChart,
  BubbleChart,
  Code,
  Difference,
  LocalOffer,
  Notifications,
  NotificationsActive,
  StackedLineChart,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Alert from "./Alert";
import AlertManager from "../services/AlertManager";

export default function Header() {
  const [isOpen, setOpen] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unSub = AlertManager.getInstance().listen(
      (alerts) => setHasAlert(alerts.length > 0),
      true
    );
    return () => unSub();
  }, []);

  const routes = [
    { name: "Dependency Graph", path: "/", icon: <BubbleChart /> },
    { name: "Dependency Graph Diff", path: "/dependencyGraphDiff", icon: <Difference /> },
    { name: "Metrics", path: "/metrics", icon: <StackedLineChart /> },
    { name: "Insights", path: "/insights", icon: <BarChart /> },
    { name: "Endpoints", path: "/endpoints", icon: <LocalOffer /> },
    { name: "Interfaces", path: "/interfaces", icon: <Code /> },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setOpen(!isOpen)}
          >
            <MenuIcon />
          </IconButton>
          <Drawer anchor="left" open={isOpen} onClose={() => setOpen(false)}>
            <List>
              {routes.map((r) => (
                <ListItemButton key={r.name} onClick={() => navigate(r.path)}>
                  <ListItemIcon>{r.icon}</ListItemIcon>
                  <ListItemText primary={r.name} />
                </ListItemButton>
              ))}
            </List>
          </Drawer>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            KMamiz
          </Typography>

          <Tooltip
            title={
              hasAlert ? "Toggle notifications" : "No notification present"
            }
          >
            <IconButton
              color="inherit"
              onClick={() => AlertManager.getInstance().toggleNotify()}
            >
              {hasAlert ? <NotificationsActive /> : <Notifications />}
            </IconButton>
          </Tooltip>
          <Alert />
        </Toolbar>
      </AppBar>
      <Toolbar />
    </Box>
  );
}
