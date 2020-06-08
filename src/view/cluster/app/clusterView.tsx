/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { Alert } from '@material-ui/lab';
import { InsertDriveFile, GetApp, VpnKey } from '@material-ui/icons';
import StopIcon from '@material-ui/icons/Stop';
import {
  Avatar,
  Button,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Tooltip,
  Typography } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      textAlign: 'left',
      '& .MuiTextField-root': {
        margin: theme.spacing(1),
        width: '25ch',
      },
      '& .MuiStepContent-root': {
        paddingLeft: theme.spacing(5)
      },
      '& .MuiStepper-root': {
        marginLeft: theme.spacing(4)
      },
      '& .MuiButton-root': {
        textTransform: 'none'
      },
      '& .MuiStepIcon-root.MuiStepIcon-active': {
        color: '#0066CC'
      },
      '& .MuiStepIcon-root.MuiStepIcon-completed': {
        color: '#0066CC'
      },
      '& .MuiButton-containedPrimary': {
        backgroundColor: '#0066CC'
      },
      '& .MuiStepLabel-iconContainer': {
        paddingRight: theme.spacing(2)
      }
    },
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(1)
    },
    actionsContainer: {
      marginBottom: theme.spacing(2),
      marginTop: theme.spacing(2)
    },
    resetContainer: {
      padding: theme.spacing(3),
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
      width: '40%'
    },
    uploadLabel: {
      marginTop: theme.spacing(2)
    }
  })
);
declare global {
  interface Window {
      acquireVsCodeApi(): any;
  }
}

const vscode = window.acquireVsCodeApi();

const crcDefaults = {
	DefaultCPUs: 4,
	DefaultMemory: 9216,
	DefaultWebConsoleURL: "https://console-openshift-console.apps-crc.testing",
	DefaultAPIURL: "https://api.crc.testing:6443",
	CrcLandingPageURL: "https://cloud.redhat.com/openshift/install/crc/installer-provisioned",
	DefaultCrcUrlBase: "http://mirror.openshift.com/pub/openshift-v4/clients/crc"
}

const crcVersions = [
  { crcVersion: "1.0.0", openshiftVersion: "4.2.0"},
  { crcVersion: "1.1.0", openshiftVersion: "4.2.2"},
  { crcVersion: "1.2.0", openshiftVersion: "4.2.8"},
  { crcVersion: "1.3.0", openshiftVersion: "4.2.10"},
  { crcVersion: "1.4.0", openshiftVersion: "4.2.13"},
  { crcVersion: "1.5.0", openshiftVersion: "4.2.14"},
  { crcVersion: "1.6.0", openshiftVersion: "4.3.0"},
  { crcVersion: "1.7.0", openshiftVersion: "4.3.1"},
  { crcVersion: "1.8.0", openshiftVersion: "4.3.8"},
  { crcVersion: "1.9.0", openshiftVersion: "4.3.10"},
  { crcVersion: "1.10.0", openshiftVersion: "4.4.3"},
  { crcVersion: "1.11.0", openshiftVersion: "4.4.5"}
];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function getSteps() {
  return ['Select OpenShift Version', 'CRC Binary Path/Download', 'File path of image pull secret', 'Select optional configurations', 'Setup CRC', 'Start the cluster'];
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function addClusterView() {
  const classes = useStyles();
  const [fileName, setBinaryPath] = React.useState('');
  const [pullSecretPath, setSecret] = React.useState('');
  const [cpuSize, setCpuSize] = React.useState(crcDefaults.DefaultCPUs);
  const [memory, setMemory] = React.useState(crcDefaults.DefaultMemory);
  const [versionLabel, setVersionLabel] = React.useState('1.11.0');
  const [crcProgress, setProgress] = React.useState(true);
  const [crcStopProgress, setStopProgress] = React.useState(false);
  const [crcError, setCrcError] = React.useState(false);
  const [crcStopStatus, setStopStatus] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const steps = getSteps();

  const messageListener = (event) => {
    if (event?.data?.action){
      const message = event.data;
        switch (message.action) {
          case 'crcstarterror' :
            setProgress(false);
            setCrcError(true);
            break;
          case 'crcstartstatus' :
            setProgress(false);
            break;
          case 'crcstoperror' :
            setStopProgress(false);
            setCrcError(true);
            break;
          case 'crcstopstatus' :
            if (message.data == 0) {
              setStopProgress(false);
              setStopStatus(true);
            }
            if (message.data == 1) {
              setStopProgress(false);
              setCrcError(true);
            }
            break;
          default:
            break;
        }
      }
    }

  window.addEventListener('message', messageListener);


  const handleUploadPath = (event) => {
    setBinaryPath(event.target.files[0].path);
  }

  const handleUploadPullSecret = (event) => {
    setSecret(event.target.files[0].path);
  }

  const handleCpuSize = (event) => {
    setCpuSize(event.target.value);
  }

  const handleMemory = (event) => {
    setMemory(event.target.value);
  }

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      const crcStartCommand = `${fileName} start -p ${pullSecretPath} -c ${cpuSize} -m ${memory}`;
      vscode.postMessage({action: 'start', data: crcStartCommand});
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDisabled = () => {
    if (activeStep === 1 && fileName === '') return true;
    if (activeStep === 2 && pullSecretPath === '') return true;
  };

  const handleStopProcess = () => {
    setStopProgress(true);
    vscode.postMessage({action: 'stop', data: `${fileName}`});
  }

  const handleCrcSetup = () => {
    vscode.postMessage({action: 'run', data: `${fileName}` })
  }

  const handleReset = () => {
    setActiveStep(0);
    setVersionLabel('1.11.0');
    setBinaryPath('');
    setSecret('');
    setCpuSize(crcDefaults.DefaultCPUs);
    setMemory(crcDefaults.DefaultMemory);
    setProgress(true);
    setStopProgress(false);
    setCrcError(false);
    setStopStatus(false);
  };

  const fetchDownloadBinary = () => {
    const platform = (window as any).platform;
    let crcBundle = '';
    if (platform === 'darwin') crcBundle = `crc-macos-amd64.tar.xz`;
    if (platform === 'win32') crcBundle = `crc-windows-amd64.zip`;
    if (platform === 'linux') crcBundle = `crc-linux-amd64.tar.xz`;
    return `${crcDefaults.DefaultCrcUrlBase}/${versionLabel}/${crcBundle}`;
  }

  const getStepContent = (step: number) => {
    switch (step) {
        case 0:
          const options = crcVersions.map((option) => {
            const majorVersion = option.openshiftVersion;
            return {
              majorVersion: majorVersion.substring(0, majorVersion.lastIndexOf('.')),
              ...option,
            };
          });          
          return (
            <Autocomplete
              id="grouped-openshift"
              options={options.sort().reverse()}
              groupBy={(option) => `OpenShift: ${option.majorVersion}`}
              getOptionLabel={(option) => option.crcVersion}
              style={{ width: 300 }}
              onInputChange={(_, val) => {
                setVersionLabel(val);
              }}
              renderOption={(option) => {
                return (
                  <React.Fragment>
                    {option.crcVersion}
                    <Typography  style={{ color: '#EE0000', marginLeft: 6, fontSize: 10 }}>
                      {option.crcVersion === '1.11.0' ? 'latest': ''}
                    </Typography>
                  </React.Fragment>
                );
              }}
              renderInput={(params) => <TextField {...params} label="CRC Version" variant="outlined" fullWidth/>}
            />
          );
        case 1:
          return (
            <div>
              <Typography>Download and extract the CodeReady Containers archive for your operating system and provide the binary path.</Typography>
              <List className={classes.uploadLabel}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <GetApp />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Download"
                    secondary={<span>This will download the crc {versionLabel} bundle.</span>}/>
                    <a href={fetchDownloadBinary()} style={{ textDecoration: 'none'}}>
                      <Button
                        variant="contained"
                        color="default"
                        component="span"
                        className={classes.button}
                        startIcon={<GetApp />}
                      >
                        Download
                      </Button>
                    </a>
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <InsertDriveFile />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<span>Binary Location<sup style={{color: '#BE0000'}}>*</sup></span>}
                    secondary="Provide the crc binary location" />
                  <div>
                    <input
                    style={{ display: "none" }}
                    id="contained-button-file"
                    type="file"
                    onChange={handleUploadPath}
                    />
                    <label htmlFor="contained-button-file">
                      <Tooltip title="This is a required field" placement="left">
                        <Button variant="contained" component="span" className={classes.button}>
                        Select Path
                        </Button>
                      </Tooltip>
                    </label>
                  </div>
                </ListItem>
                <Divider variant="inset" component="li" />
                {fileName && (
                    <TextField
                      id="outlined-location"
                      label="Binary Location"
                      style={{ marginTop: '20px', width: '100%'}}
                      fullWidth
                      defaultValue={fileName}
                      InputProps={{
                        readOnly: true,
                      }}
                      variant="outlined"
                      size="small"
                    />
                  )}
            </List>
          </div>)
        case 2:
          return (
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <VpnKey />
                  </Avatar>
                </ListItemAvatar>
              <ListItemText
                primary={<span>Provide the pull secret.<sup style={{color: '#BE0000'}}>*</sup></span>}
                secondary={<span>Download pull secret file from <a href={crcDefaults.CrcLandingPageURL}>here</a> and upload it.</span>} />
              <div className={classes.uploadLabel}>
                <input
                style={{ display: "none" }}
                id="contained-button-file"
                multiple
                type="file"
                onChange={handleUploadPullSecret}
                />
                <label htmlFor="contained-button-file">
                  <Tooltip title="This is a required field" placement="left">
                    <Button variant="contained" component="span">
                    Select Pull Secret file
                    </Button>
                  </Tooltip>
                </label>
              </div>
            </ListItem>
            {pullSecretPath && (
              <TextField
                id="outlined-location"
                label="Pull Secret Location"
                style={{ marginTop: '20px', width: '100%'}}
                fullWidth
                defaultValue={pullSecretPath}
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
                size="small"
              />
            )}
          </List>)
        case 3:
          return (
            <div>
              <TextField
                id="outlined-number"
                label="CPU cores"
                type="number"
                variant="outlined"
                size="small"
                onChange={handleCpuSize}
                value={cpuSize}
                InputProps={{ inputProps: { min: crcDefaults.DefaultCPUs } }}
              />
              <TextField
                id="outlined-number"
                label="Memory to allocate"
                type="number"
                variant="outlined"
                size="small"
                onChange={handleMemory}
                value={memory}
                InputProps={{ inputProps: { min: crcDefaults.DefaultMemory } }}
                helperText="Value in MiB"
              />
            </div>)
        case 4:
          return (
            <List>
              <ListItem>
              <ListItemText
                primary={<span>Set up local virtualization and networking infrastructure for the OpenShift cluster.</span>}
                secondary={<span>Once the setup process is successful, then proceed to start the cluster in Next step.</span>} />
                <Button 
                  variant="contained"
                  color="primary"
                  onClick={handleCrcSetup}
                  className={classes.button}>
                  Setup CRC
                </Button>
              </ListItem>
          </List>)
        case 5:
          return (
            <Typography>
              Start the cluster. This will also set up local virtualization and networking infrastructure for the OpenShift cluster.
            </Typography>)
        default:
          return 'Unknown step';
    }
  }

  return (
    <div className={classes.root}>
      <Paper elevation={3}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                {getStepContent(index)}
                <div className={classes.actionsContainer}>
                  <div>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      className={classes.button}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
                      className={classes.button}
                      disabled={handleDisabled()}
                    >
                      {activeStep === steps.length - 1 ? 'Start Cluster' : 'Next'}
                    </Button>
                  </div>
                </div>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
      {activeStep === steps.length && (
        <div>
          <Paper square elevation={3} className={classes.resetContainer}>
            {(crcProgress && !crcError) &&
              (<div>
                <LinearProgress />
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Setting Up the OpenShift Instance"
                    />
                  </ListItem>
                </List>
              </div>)}
              {crcStopProgress &&
              (<div>
                <LinearProgress />
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Stopping OpenShift Instance"
                    />
                  </ListItem>
                </List>
              </div>)}
              {crcError && (
              <div>
                <List>
                  <ListItem>
                    <Alert variant="filled" severity="error" style={{ backgroundColor: '#a30000'}}>CRC Process errored out. Check Output channel for details.</Alert>
                  </ListItem>
                </List>
              </div>)}
              {(!crcProgress && !crcError && !crcStopStatus) &&(
                <div>
                  <List>
                    <ListItem>
                      <Alert variant="filled" severity="success" style={{ backgroundColor: '#0066CC'}}>OpenShift Instance is up.</Alert>
                    </ListItem>
                    <ListItem>
                      <a href={crcDefaults.DefaultWebConsoleURL} style={{ textDecoration: 'none'}}>
                        <Button
                          variant="contained"
                          component="span"
                          className={classes.button}
                        >
                          Open OpenShift Console
                        </Button>
                      </a>
                      <Button
                          variant="contained"
                          component="span"
                          className={classes.button}
                          onClick={handleStopProcess}
                          startIcon={<StopIcon />}
                        >
                          Stop CRC
                      </Button>
                    </ListItem>
                  </List>
                </div>)}
                {crcStopStatus && (
                <div>
                  <List>
                    <ListItem>
                      <Alert variant="filled" severity="success" style={{ backgroundColor: '#0066CC'}}>OpenShift Instance is Stopped.</Alert>
                    </ListItem>
                  </List>
                </div>)}
                <label htmlFor="contained-button-file">
                  <Tooltip title="This will reset the wizard configuration to defaults." placement="right">
                    <Button onClick={handleReset} className={classes.button}>
                      Reset
                    </Button>
                  </Tooltip>
                </label>
          </Paper>
        </div>
      )}
    </div>
  );
}