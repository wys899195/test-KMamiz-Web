import { makeStyles } from "@mui/styles";
import {
  useState,
  SyntheticEvent,
  ReactNode,
} from 'react';
import {
  Tab,
  Tabs, 
  Typography,
  Box,
  Accordion,
  AccordionActions,
  AccordionSummary,
  AccordionDetails,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined';
import PlaylistRemoveOutlinedIcon from '@mui/icons-material/PlaylistRemoveOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { faSquare,faSquarePlus,faSquareMinus,faSquareCaretUp } from '@fortawesome/free-regular-svg-icons'
import { GraphDifferenceState,GraphDifferenceInfo } from "../classes/DependencyGraphUtils";

const useStyles = makeStyles(() => ({
  TabPanelHeader: {
    backgroundColor:'lightGray',
    textAlign:'center',
    borderBottom: '0.2em solid #ccc',
  },
  serviceGroupBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    width:'calc(100% - 0px)',
  },
  enpointGroupBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    width:'calc(100% - 2em)',
    margin:'0.0em 1em 0.0em 1em',
    borderBottom: '0.2em solid #ccc',
  },
  enpointGroupBlockLast: {
    borderBottom: 'none',
  },
}));

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

export type DiffIconProps = {
  state:GraphDifferenceState
};

export type TabPanelInnerComponentProps = {
  graphDifferenceInfo: GraphDifferenceInfo,
  whichTab:GraphDifferenceState,
  isModifiedBlock:boolean,
};

export type GraphDiffTabsProps = {
  graphDifferenceInfo: GraphDifferenceInfo;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}
// {...a11yProps(0)} 
function DiffIcon(prop:DiffIconProps) {
  switch (prop.state){
    case 'added':
      return(
        <FontAwesomeIcon icon={faSquarePlus}  size="lg" style={{color: "#29d507",}} />
      );
    case 'deleted':
      return(
        <FontAwesomeIcon icon={faSquareMinus} size="lg" style={{color: "#f94848",}} />
      );
    case 'modified':
      return(
        <div className="fa-layers fa-fw" style={{margin:'0.0em -0.0625em 0.0em -0.0625em',}}>
          <FontAwesomeIcon icon={faSquare} size='lg' style={{color: "#dfbb3a",}}/>
          <FontAwesomeIcon icon={faCircle} size='2xs' style={{color: "#dfbb3a",}}/>
        </div>
      );
  }
}

function TabPanelInnerComponent(prop:TabPanelInnerComponentProps) {
  if (prop.whichTab == 'modified') {
    return (
      <Typography variant="h5">Modified is not a valid tab.</Typography>
    )
  }
  const classes = useStyles();
  const {addedNodesAfterGrouping,deletedNodesAfterGrouping} = prop.graphDifferenceInfo;
  const NodeGroupInfos = prop.whichTab == 'added' ? addedNodesAfterGrouping : deletedNodesAfterGrouping;
  const NodeGroupInfosFiltered = NodeGroupInfos.filter(groupInfo => groupInfo.ServiceNodeState == (prop.isModifiedBlock ? 'modified' : prop.whichTab))

  return(
    <div>
      <div className={classes.TabPanelHeader}>
        { NodeGroupInfosFiltered.length } { prop.isModifiedBlock ? (prop.whichTab == 'added' ? " services add endpoint" : " services delete endpoint") : " new services" }
      </div>
      <div>
        {NodeGroupInfosFiltered
          .map((groupInfo) => (
            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
                <div className={classes.serviceGroupBlock}>
                  <Typography sx={{ color: 'text.secondary' }}>
                    <DiffIcon  state = {prop.isModifiedBlock ? 'modified' : prop.whichTab } /> SRV 
                  </Typography>
                  <Typography >
                    {groupInfo.groupName}
                  </Typography>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                {groupInfo.endPointNodes.map((node) => (
                  <div className={classes.enpointGroupBlock}>
                    <Typography sx={{ color: 'text.secondary' }}>
                      <DiffIcon  state = {prop.whichTab} /> EP 
                    </Typography>
                    <Typography >
                      {node.name}
                    </Typography>
                  </div>
                ))}
              </AccordionDetails>
            </Accordion>
            ))}
      </div>
    </div>
  );
}


export default function GraphDiffTabs(prop:GraphDiffTabsProps) {
  const {addedNodesAfterGrouping,deletedNodesAfterGrouping} = prop.graphDifferenceInfo;
  const classes = useStyles();
  const [value, setValue] = useState(0);
  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="graph diff tabs" variant="fullWidth" >
          <Tab icon={<PlaylistAddOutlinedIcon />} label="Added" {...a11yProps(0)} />
          <Tab icon={<PlaylistRemoveOutlinedIcon />} label="Deleted" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <TabPanelInnerComponent graphDifferenceInfo={prop.graphDifferenceInfo} whichTab={"added"} isModifiedBlock={false} />
        <TabPanelInnerComponent graphDifferenceInfo={prop.graphDifferenceInfo} whichTab={"added"} isModifiedBlock={true} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <TabPanelInnerComponent graphDifferenceInfo={prop.graphDifferenceInfo} whichTab={"deleted"} isModifiedBlock={false} />
        <TabPanelInnerComponent graphDifferenceInfo={prop.graphDifferenceInfo} whichTab={"deleted"} isModifiedBlock={true} />
      </TabPanel>
    </Box>
  );
}
