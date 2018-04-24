import { mysensor_command, mysensor_data, mysensor_sensor, mysensor_internal } from '../lib/mysensors-types';
import { Red } from 'node-red';
import { MysensorsMsg } from '../lib/mysensors-msg';
import { IEncapsulateConfig, IEncapsulateProperties } from './common';

export = (RED: Red) => {
    RED.nodes.registerType("mysencap", function (this: IEncapsulateConfig, config: IEncapsulateProperties) {
        RED.nodes.createNode(this,config);
        this.sensor = {
            nodeId: config.nodeId,
            childSensorId: config.childId,
            subType: config.subType,
            messageType: config.msgtype,
            ack: config.ack?1:0,
            payload: ''
        };
        this.presentation = config.presentation || false;
        this.presentationtext = config.presentationtext || '';
        this.presentationtype = config.presentationtype || 0;
        this.fullpresentation = config.fullpresentation || false;
        this.internal = config.internal || 0;
        this.firmwarename = config.firmwarename  || '';
        this.firmwareversion = config.firmwareversion || '';
        
        if (this.presentation) {
            setTimeout(() => {
                let msg: MysensorsMsg = this.sensor;
                msg.ack = 0;
                if (this.fullpresentation) {
                    msg.messageType = 3;
                    msg.childSensorId = 255; // Internal messages always send as childi 255
                    msg.subType = 11; // Sketchname
                    msg.payload = this.firmwarename;                
                    this.send(msg);

                    msg.subType = 12; // Sketchname
                    msg.payload = this.firmwareversion;                
                    this.send(msg);
                }
                msg.messageType = 0;
                msg.subType = this.presentationtype;
                msg.payload = this.presentationtext;
                this.send(msg);
            }, 5000);
        }

        this.on('input', (msg: MysensorsMsg) => {
            const msgOut = this.sensor;
            msgOut.payload = msg.payload;
            if (this.sensor.messageType == 3) {
                msgOut.childSensorId = 255;
                msgOut.subType = this.internal;
            }
            this.send(msgOut);
        });

    });
    
    RED.httpAdmin.get("/mysensordefs/:id", RED.auth.needsPermission(''), function(req: any , res: any) {
        let type = req.params.id;
        let mysVal: any;
        switch (type) {
            case "subtype": 
                mysVal = mysensor_data;
                break;
            case "presentation":
                mysVal = mysensor_sensor;
                break;
            case "internal":
                mysVal = mysensor_internal;
                break;
        }
        res.json(JSON.stringify({data:Object.keys(mysVal).filter(k => typeof mysVal[k as any] === "number")}));
    });
}