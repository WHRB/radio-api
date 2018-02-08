variable "region" {
  default = "us-east-1"
}

provider "aws" {
  region = "${var.region}"
}

variable "backend_bucket" {}
variable "backend_key" {}

terraform {
  backend "s3" {
    bucket = "${var.backend_bucket}"
    key    = "${var.backend_key}"
    region = "${var.region}"
  }
}

variable "remote_key" {}

data "terraform_remote_state" "network" {
  backend = "s3"
  config {
    bucket = "${var.backend_bucket}"
    key    = "${var.remote_key}"
    region = "${var.region}"
  }
}

# Beanstalk Application
resource "aws_elastic_beanstalk_application" "whrbapi-application" {
  name        = "whrbapi-application"
  description = "WHRB api application"
}

variable "spin_secret" {}
variable "spin_station" {}
variable "spin_userid" {}
variable "schedule_api_key" {}
variable "schedule_id" {}

# Beanstalk Environment
resource "aws_elastic_beanstalk_environment" "whrbapi-application_environment" {
  name                = "whrbapi-dev"
  application         = "${aws_elastic_beanstalk_application.whrbapi-application.name}"
  solution_stack_name = "64bit Amazon Linux 2017.09 v4.4.4 running Node.js"
  tier                = "WebServer"

  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = "${data.terraform_remote_state.network.whrb_vpc_id}"
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = "${data.terraform_remote_state.network.whrb_subA_id}"
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "AssociatePublicIpAddress"
    value     = "true"
  }

  setting {
    namespace = "aws:elb:loadbalancer"
    name      = "CrossZone"
    value     = "true"
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value = "t2.micro"
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "EC2KeyName"
    value = "EC2"
  }

  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = "1"
  }

  setting {
    namespace = "aws:elasticbeanstalk:container:nodejs"
    name      = "NodeVersion"
    value     = "8.9.3"
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = "${data.terraform_remote_state.network.whrb_beanstalk_instance_profile_name}"
  }

  setting {
    namespace = "aws:elasticbeanstalk:healthreporting:system"
    name      = "SystemType"
    value     = "enhanced"
  }

  # Configure a health check path for your application. (ELB Healthcheck)
  # setting {
  #   namespace = "aws:elasticbeanstalk:application"
  #   name      = "Application Healthcheck URL"
  #   value     = "/nowplaying"
  # }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SPIN_STATION"
    value     = "${var.spin_station}"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SPIN_USERID"
    value     = "${var.spin_userid}"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SPIN_SECRET"
    value     = "${var.spin_secret}"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SCHEDULE_API_KEY"
    value     = "${var.schedule_api_key}"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SCHEDULE_ID"
    value     = "${var.schedule_id}"
  }
}
