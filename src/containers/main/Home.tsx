import React from "react";
import {ActivityIndicator, BackHandler, Image, StyleSheet, Text, TouchableOpacity, View,Alert} from 'react-native'
import * as SecureStore from "expo-secure-store";
import Colors from "../../utils/colors";
import {Constants} from "../../utils/constants";
import Strings from "../../utils/strings";
import Button from "../../components/Button";
import EarningItem from "../../components/EarningItem";
import {formatMoney, getSecureStoreItem} from "../../utils/CommonFunction";
import Transport from "../../api/Transport";
import moment from "moment";

export interface Props {
    navigation: any;
    profileDetail: any;
}

interface State {
    idx: number;
    status: any;
    requestActive: any;
    isLoading: boolean;
    totalEarnings: string;
}

export default class Home extends React.Component<Props, State> {

    constructor(Props: any) {
        super(Props);
        this.state = {
            requestActive: [],
            isLoading: true,
            idx: 0,
            totalEarnings: '0.00',
            status: [
                {
                    color: 'green',
                    label: 'ACTIVE'
                },
                {
                    color: 'orange',
                    label: 'ON DUTY'
                },
                {
                    color: 'red',
                    label: 'DISCONNECTED'
                }]
        }
    }

    handleBackButtonClick = () => {
        this.props.navigation.goBack();
        return true;
    };

    async UNSAFE_componentWillMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
        this.checkStatus()
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    async componentDidMount() {
        let isAllFileSubmitted = await SecureStore.getItemAsync('isAllFileSubmitted')
        if (isAllFileSubmitted === null) {
            await SecureStore.setItemAsync('isAllFileSubmitted', 'True')
        }
        await this.servicesList()
    }

    render() {

        const Landing = Strings.home,
            {profileDetail} = this.props

        return (
            <View style={{backgroundColor: Colors.primaryColor, flex: 1}}>
                <TouchableOpacity
                    onPress={() => this.props.navigation.navigate('MyProfile', {profileDetail})}
                    style={{marginVertical: 45, marginHorizontal: 25, flexDirection: 'row', alignItems: 'center'}}>
                    <Image resizeMode={'cover'} source={{uri: profileDetail.profilePicture}}
                           style={{width: 60, height: 60, borderRadius: 250}}/>
                    <View style={{marginHorizontal: 20, justifyContent: 'center'}}>
                        <Text allowFontScaling={false}         // @ts-ignore
                              style={{
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: Constants.fontWeight
                              }}>{profileDetail.fullName}</Text>
                        <View>
                            <Text allowFontScaling={false}
                                  style={{color: Colors.white, fontSize: 12}}>{Landing.profile.button}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <View style={{alignItems: 'center', marginBottom: 15}}>
                    <Text allowFontScaling={false}
                          style={{fontSize: 18, color: Colors.white}}>{Landing.overview.title}</Text>
                    <Text allowFontScaling={false}  // @ts-ignore
                          style={{
                              fontSize: 36,
                              color: Colors.white,
                              fontWeight: Constants.fontWeight
                          }}>$ {formatMoney(this.state.totalEarnings)}</Text>
                </View>

                <View style={{alignItems: 'center', marginVertical: 25}}>
                    {
                        Landing.buttons.map((button: string, idx) => {
                            return (
                                <Button key={idx} onPress={() => {
                                     let id=this.state.idx;
                                    switch (this.state.idx) {
                                        case 0:
                                            id=this.state.idx+1;
                                            //  this.setState({idx: this.state.idx + 1})
                                            break;
                                        case 1:
                                            id=this.state.idx+1
                                            //  this.setState({idx: this.state.idx + 1})
                                            break;
                                        case 2:
                                            id=0
                                            //  this.setState({idx: 0})
                                            break;

                                    }
                                    this.changeStatus(id)
                                }}
                                        label={this.state.status[this.state.idx].label}
                                        isLoading={false}
                                        style={{width: '75%', backgroundColor: this.state.status[this.state.idx].color}}
                                        noBorder={false} disabled={false}/>
                            )
                        })
                    }
                </View>
                <View>
                    <Text allowFontScaling={false} // @ts-ignore
                          style={{
                              fontSize: 16,
                              paddingVertical: 20,
                              paddingHorizontal: 20,
                              borderBottomWidth: Constants.borderWidth / 2,
                              borderColor: Colors.gray,
                              color: Colors.white,
                              fontWeight: Constants.fontWeight
                          }}>{Landing.next.title}</Text>

                    <View style={{marginHorizontal: 20}}>
                        {
                            this.state.isLoading ?
                                <ActivityIndicator size={'large'} color={Colors.secondaryColor}
                                                   style={{paddingTop: '50%'}}/>
                                :
                                this.state.requestActive.length === 0 && !this.state.isLoading ?

                                    <Text allowFontScaling={false} style={{
                                        fontSize: 18,
                                        textAlign: 'center',
                                        paddingTop: 100,
                                        color: Colors.gray
                                    }}>{Landing.next.noService}</Text> :
                                    this.state.requestActive.map((eventDetail: any, index: number) => {
                                        console.log("anjetua",JSON.stringify(eventDetail))
                                        return (
                                            <EarningItem key={index} navigation={this.props.navigation}
                                                         onPress={() => {
                                                         }}
                                                         eventDetail={eventDetail}/>
                                        )
                                    })
                        }
                    </View>
                </View>
            </View>
        );
    }


    async servicesList() {
        this.setState({
            isLoading: true,
            requestActive: [],
        })
        let token = await getSecureStoreItem('token'),
            request = await Transport.Request.getUserRequests(JSON.parse(token))
                .finally(() => this.setState({isLoading: false}))
                .catch((error: any) => {
                    console.log(error);
                })
        if (request.data.status) {

            Transport.Earnings.getEarnings(JSON.parse(token))
            .then(async (res: any) => {
                let earnings = res.data.data || [],
                    totalEarnings = res.data.totalEarnings || '0.00',
                    currentEarnings = res.data.currentEarnings
                    this.setState({totalEarnings})
            })
            .catch((err: any) => console.log(err))

            let data = await Promise.all(
                request.data?.data &&
                request.data.data.length > 0 &&
                request.data.data.map(async (item: any) => {
                    console.log("i am who i am",JSON.stringify(item))
                    let itemDetail = {
                        id: item.id,
                        status: item.status,
                        date: new Date(item.detail.serviceDate[0]).getDate() || item.detail.serviceDate[0],
                        day: Strings.home.days[new Date(item.detail.serviceDate[0]).getDay()],
                        formattedDate:item.detail.serviceDate[0],
                        detail: {
                            name: item.profile.fullName,
                            address: item.pickupAddress.streetAddress ? `${item.pickupAddress?.streetAddress}, ${item.pickupAddress?.state}, ${item.pickupAddress?.city}` : " --- ",
                            hours: '$ ' + item.hourlyOffer
                        },
                        profile: item.profile
                    }
                    switch (item.status.toLowerCase()) {
                        // case 'pending':
                        //     let requestPending = this.state.requestPending
                        //     requestPending.push(itemDetail)
                        //     this.setState({requestPending})
                        //     return;
                        case 'accepted':
                            let requestActive = this.state.requestActive
                            requestActive.push(itemDetail)
                            this.setState({requestActive})
                            return;
                        // case 'canceled':
                        //     let requestCanceled = this.state.requestCanceled
                        //     requestCanceled.push(itemDetail)
                        //     this.setState({requestCanceled})
                        //     return;
                    }
                })
            ).catch(err => console.log(err))
        }
    }
    async checkStatus(){
        let token = await getSecureStoreItem('token'),
        request = await Transport.User.profileDetails(JSON.parse(token))
        .finally(() => this.setState({isLoading: false}))
        .catch((error: any) => {
            console.log(error);
        })
        console.log("sonic",JSON.stringify(request.data.data.email))
        let req= await Transport.Request.checkStatus(JSON.parse(token),request.data.data.email)
            .finally(() => this.setState({isLoading: false}))
            .catch((error: any) => {
                console.log(error);
            }) 
            if(req){
                 let stats=this.state.status;
                // let id=stats.indexOf(req.data.availability);
                // console.log("reqs",JSON.stringify(id));
                let chosen=0;
                for(var i=0;i<stats.length;i++){
                    console.log("statusi",JSON.stringify(req.data))
                    if(stats[i].label && stats[i].label===req.data.availability){
                        chosen=i;
                    }
                }
                console.log("reqs",req.data.availability+chosen)
                  this.setState({idx:chosen})
            }
           
    }
    async changeStatus(value:number){
        console.log("value",value)
        this.setState({
            isLoading:true
        })
        
        let token = await getSecureStoreItem('token'),
        reqst = await Transport.User.profileDetails(JSON.parse(token))
        .finally(() => this.setState({isLoading: false}))
        .catch((error: any) => {
            console.log(error);
        });
        console.log("tokeno",token)
        let email_e=reqst.data.data.email
        console.log("thatswhy",reqst.data.data.email)
        let request = await Transport.Request.changeStatus(JSON.parse(token),value.toString(),email_e,{})
.finally(() => this.setState({isLoading: false}))
        .catch((error: any) => {
            console.log("error",error);
        })
        if (request!==undefined) {
            let data = request.data?.data 
             this.checkStatus()
             console.log("data",value)
            // for(var i=0;i<)
            // let dt=this.state.status.indexOf(data.availability)
            // console.log("data5",dt)
        }   else{
            Alert.alert("Error","error changing status")
            console.log("nothing","returned")
        }

    }
    
}

const styles = (props: any) => {
    return StyleSheet.create({});
};

