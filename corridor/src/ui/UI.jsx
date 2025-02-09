import { useState } from "react";

export default function UI() {
    const [story, setStory] = useState(0);
    const [storyContent, setStoryContent] = useState([
        {
            title: "Liminal Russia",
            text: "Welcome to the backrooms of the mind of a Russian emigrant. Get cosy and enjoy the stroll.",
            button: "Next"
        },
        {   
            title: "What's here?",
            text: "It's not always logical and contains some sporadic memory portals.",
            button: "Next"
        },
        {
            title: "Portals",
            text: "Due to memory loss, all portals are distorted. Due to the lack of straight thinking, you might end up going in circles.",
            button: "Next"
        },
        {
            title: "Memories",
            text: "Whether it's a memory of a childhood home or a kitchen talk with your relatives, it's all here. Somewhere...",
            button: "Start"
        }
            
    ]);
    return (
        <>
        <div className="story-container">
            <h1 className="story-title">Liminal Russia</h1>
            <div className="story-content"> 
                <div className="story-text">
                    <h2 className="story-subtitle">
                        {storyContent[story].title}
                    </h2>
                    <p>
                        {storyContent[story].text}
                    </p>
                    <button className="story-button" onClick={() => {
                        if (story < storyContent.length - 1) {
                            setStory(story + 1);
                        } else {
                            //hide story container
                            document.querySelector('.story-content').style.display = 'none';
                        }
                    }}>
                        {storyContent[story].button}
                    </button>
                </div>
            </div>
        </div>
        <div className="ui-container">
            <div className="ui-content ui-w">W</div>
            <div className="ui-content ui-a">A</div>
            <div className="ui-content ui-s">S</div>
            <div className="ui-content ui-d">D</div>
            <div className="ui-content ui-space">Space</div>
        </div>
        </>
    )
}