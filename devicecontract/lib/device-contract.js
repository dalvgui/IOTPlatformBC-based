/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

const states = {
    'ISSUED' : 0 , 
    'REGISTERED' : 1 ,
    'REDEEMED' : 2 
}

class DeviceContract extends Contract {    

    async _deviceExists(ctx, deviceId) {
        const buffer = await ctx.stub.getState(deviceId);
        return (!!buffer && buffer.length > 0);
    }

    async createDevice(ctx, deviceId, issue_date) {
        const exists = await this._deviceExists(ctx, deviceId);
        if (exists) {
            throw new Error(`El dispositivo ${deviceId} ya existe`);
        }
        const state = states.ISSUED
        const issuer = ctx.clientIdentity.getMSPID();
        const asset = { issuer , issue_date , state  };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(deviceId, buffer);
    }

    async readDevice(ctx, deviceId) {
        const exists = await this._deviceExists(ctx, deviceId);
        if (!exists) {
            throw new Error(`The device ${deviceId} does not exist`);
        }
        const buffer = await ctx.stub.getState(deviceId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async registerDevice(ctx, deviceId, ip , mac , modelo , hash_generated) {
        const exists = await this._deviceExists(ctx, deviceId);
        if (!exists) {
            throw new Error(`El dispositivo ${deviceId} no existe`);
        }
        const device = await this.readDevice(ctx , deviceId);        
        if (device.state != states.ISSUED) {
            throw new Error(`El dispositivo ${deviceId} no se encuentra disponible para ser registrado`);
        }

        const issuer = ctx.clientIdentity.getMSPID();
        if (device.issuer != issuer){
            throw new Error(`No tienes permisos para registrar el dispositivo ${deviceId}`);
        }

        const asset = { issuer:device.issuer , issue_date:device.issue_date  , state : states.REGISTERED , ip , mac , modelo , hash_generated };

        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(deviceId, buffer);
    }

    async cancelDevice(ctx, deviceId) {
        const exists = await this._deviceExists(ctx, deviceId);
        if (!exists) {
            throw new Error(`El dispositivo ${deviceId} no existe`);
        }
        const device = await this.readDevice(ctx , deviceId);        
        if (device.state != states.REGISTERED) {
            throw new Error(`El dispositivo ${deviceId} no se encuentra disponible para ser registrado`);
        }

        const issuer = ctx.clientIdentity.getMSPID();
        if (device.issuer != issuer){
            throw new Error(`No tienes permisos para registrar el dispositivo ${deviceId}`);
        }

        const asset = { issuer:device.issuer , issue_date:device.issue_date  , state : states.REDEEMED , ip: device.ip , mac: device.mac , modelo: device.modelo , hash_generated : device.hash_generated };

         const buffer = Buffer.from(JSON.stringify(asset));
         await ctx.stub.putState(deviceId, buffer);
    }
	
	async queryAllDevices(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

}

module.exports = DeviceContract;
