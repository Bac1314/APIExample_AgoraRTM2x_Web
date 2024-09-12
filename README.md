<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Bac1314/APIExample_AgoraRTM2x">
    <!-- <img src="images/logo.png" alt="Logo" width="80" height="80"> -->
  </a>

<h3 align="center">Agora Real-time Messaging (RTM) SDK APIExample for Web</h3>


  <p align="center">
    <a href="https://docs.agora.io/en/signaling/get-started/sdk-quickstart?platform=web"><strong>Explore the API Reference »</strong></a>

  </p>
</div>


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

<!-- [![Product Name Screen Shot][product-screenshot]](https://example.com) -->

This project showcases how to use Agora RTM SDK to build real-time interactive scenarios such as chat messaging, live bidding, live poll/quiz.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Built With

* Javascript, HTML, and CSS
* Agora RTM SDK 2.x.x (aka Signaling SDK)
<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started


### Prerequisites

* Browser


### Installation

1. Create an Agora account and enable the Signaling/RTM product [https://docs.agora.io/en/signaling/get-started/beginners-guide?platform=ios]
2. Enable the Storage Configuration (Storage, User attribute callback, Channel attribute callback, and Distributed Lock)
3. Clone this repo to your local machine 
   ```
   git clone https://github.com/Bac1314/APIExample_AgoraRTM2x_Web.git
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

The list of samples and what feature is used


| **Samples**      | **Description**                                                                                      | **RTM ChannelType** | **RTM Features**  |
|------------------|------------------------------------------------------------------------------------------------------|---------------------|-------------------|
| [Channel Messaging](./Basic/1_ChannelMessaging/) | Build a simple chat system using pub/sub model.                                                      | Message             | `.message`, `.presence` |
| [P2P Messaging](./Basic/2_Peer_to_Peer_Messaging/)     | Peer-to-peer messaging                      | User               | /                 |
| [Stream Messaging](./Basic/3_StreamMessaging/)          | Pub-and-sub model with RTM Stream Channel's topics | Stream             | `.presence`           |
| [Polling](./Advanced/1_Polling/)          | Setup polls through Message Channel                                  | Message             | `.message`, `.presence` |
| [QuizGame](./Advanced/2_Quiz/)         | Setup a quiz game and score through Message Channel and Presence Userstates                                           | Message             | `.message`, `.presence` |
| [Bidding](./Advanced/3_LiveBidding/)          | Live bidding scenario where the auction data is stored using the `.storage` channel metadata feature. | Message             | `.storage`           |
| [Whiteboard](./Advanced/4_Whiteboard/)          | Real-time whiteboard collaboration tool  | Message, Stream             | `.message`, `.presence`             |
| [Audio Recording](./Advanced/5_AudioRecording/)          | Send audio recording through Message Channel | Message             | `.message`, `.presence`             |
| [File Sharing](./Advanced/6_FileSharing/)          | Share files through Message Channel | Message             | `.message`, `.presence`             |
| [Audio Call](./Advanced/7_P2PAudioCall/)          | P2P audio call with Agora RTC | Message             | `.message`, `.presence`          |
| [Virtual Gifting](./Advanced/8_VirtualGifting/)          | Send virtual emojis through Message Channel | Message             | `.message`          |
| [Minigame - TicTacToe](./Advanced/9_Minigame_TicTacToe/)          | TicTacToe game using Storage Channel Metadata | Message             | `.storage`, `.presence`         |
| [Minigame - Go](./Advanced/10_MiniGame_Go/)          | Go game using Storage Channel Metadata | Message             | `.storage`, `.presence`         |

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- Share images and files using third-party storage such as Amazon S3
- Real-time coding
- 1-to-1 video call using RTC + RTM + Apple CallKit

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- ROADMAP -->
## Potential Samples

- Online collaborative tools
- Interactive games
- Real-time IoT event sharing

If you have any requests/ideas, feel free to let me know. 

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- RTM API Limitation -->
## References

- API Reference (https://docs.agora.io/en/signaling/reference/api?platform=web)
- Pricing (https://docs.agora.io/en/signaling/overview/pricing?platform=web)
- API Limitations (https://docs.agora.io/en/signaling/reference/limitations?platform=web)
- Security/Compliance (https://docs.agora.io/en/signaling/reference/security?platform=webd) 


<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- RTM API Limitation -->
## Native iOS Demo

- https://github.com/Bac1314/APIExample_AgoraRTM2x


<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Bac Huang  - bac@boldbright.studio

Project Link: [https://github.com/Bac1314/APIExample_AgoraRTM2x](https://github.com/Bac1314/APIExample_AgoraRTM2x)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



