/**
 * A simple Lambda function to 'poke' a hole in an AWS security group for temporary access from an
 * authorised IP.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const aws = require( 'aws-sdk' ),
      momentTimezone = require( 'moment-timezone' ),
      lambdaProxyResponse = require( '@tdmalone/lambda-proxy-response' ),
      apiGatewaySampleRequest = require( 'tests/fixtures/api-gateway-request.json' );

/* eslint-disable no-process-env */
const config = {
  securityGroupId: process.env.AWS_SECURITY_GROUP_ID,
  ports:           process.env.AWS_SECURITY_GROUP_PORTS.split( ',' ),
  timezone:        process.env.LOCAL_TIMEZONE,
  CI:              process.env.CI
};
/* eslint-enable no-process-env */

exports.handler = ( event, context, callback ) => {

  const ec2 = new aws.EC2({ apiVersion: '2016-11-15' }),
        ipAddress = event.requestContext.identity.sourceIp,
        testIpAddress = apiGatewaySampleRequest.requestContext.identity.sourceIp,
        date = momentTimezone.tz( config.timezone ).format( 'YYYY-MM-DD h:mm A Z' );

  // Add inbound rules to the specified security group for each specified port.
  // @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ec2-example-security-groups.html
  // @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#authorizeSecurityGroupIngress-property

  const params = {
    GroupId:       config.securityGroupId,
    IpPermissions: []
  };

  config.ports.forEach( ( port ) => {

    params.IpPermissions.push({
      IpProtocol: 'tcp',
      FromPort:   port,
      ToPort:     port,
      IpRanges:   [ {
        'CidrIp':      ipAddress + '/32',
        'Description': 'securityGroupIpPoker ' + date
      } ]
    });

  });

  ec2.authorizeSecurityGroupIngress( params, ( error, response ) => {

    if ( error ) {
      return lambdaProxyResponse({ error: error }, null, callback );
    }

    const message = response.length ? response : {
      message: 'Success: ' + ipAddress + ' has been added to the specified ports.'
    };

    // If we're not running tests, we're good to go!
    if ( ipAddress !== testIpAddress ) {
      return lambdaProxyResponse( null, message, callback );
    }

    // If running tests, we also need to remove the IP afterwards, otherwise any subsequent tests
    // will fail due to trying to re-add the same IP again.
    ec2.revokeSecurityGroupIngress( params, ( error, response ) => {

      if ( error ) {
        return lambdaProxyResponse({ error: error }, null, callback );
      }

      message.message = response.length ? response : message.message + ' Test address has been removed.';

      return lambdaProxyResponse( null, message, callback );

    }); // RevokeSecurityGroupIngress.
  }); // AuthorizeSecurityGroupIngress.
}; // Exports.handler.
