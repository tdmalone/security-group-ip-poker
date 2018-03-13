/**
 * A simple Lambda function to 'poke' a hole in an AWS security group for temporary access from an
 * authorised IP.
 *
 * @author Tim Malone <tdmalone@gmail.com>
 */

'use strict';

const aws = require( 'aws-sdk' );

/* eslint-disable no-process-env */
const config = {
  securityGroupId: process.env.AWS_SECURITY_GROUP_ID,
  ports:           process.env.AWS_SECURITY_GROUP_PORTS.split( ',' )
};
/* eslint-enable no-process-env */

exports.handler = ( event, context, callback ) => {

  // TODO.

  // Get user's IP address.
  // @see https://stackoverflow.com/a/37560348/1982136

  // Add inbound rules to the specified security group for each specified port.
  // @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ec2-example-security-groups.html

  callback();

}; // Exports.handler.
